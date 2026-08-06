"use server";

import { prisma } from "@carvia/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOnboardedSession } from "../../lib/auth";
import { providerCatalog } from "../../lib/providers";

const allowedProviderKeys = providerCatalog
  .map((provider) => provider.providerKey)
  .filter((providerKey) => providerKey !== "mock");

const providerKeySchema = z.enum(allowedProviderKeys as [string, ...string[]]);

const providerStatusSchema = z.enum(["CONNECTED", "NOT_CONFIGURED", "DISABLED", "ERROR"]);
const providerSyncModeSchema = z.enum(["MANUAL", "SCHEDULED", "PAUSED"]);

const upsertProviderSchema = z.object({
  cadenceHours: z.coerce.number().int().min(1).max(168).optional(),
  credentialsHint: z.string().trim().max(500).optional(),
  providerKey: providerKeySchema,
  status: providerStatusSchema,
  syncMode: providerSyncModeSchema
});

const providerActionSchema = z.object({
  providerKey: providerKeySchema
});

const providerErrorSchema = z.object({
  message: z.string().trim().min(3).max(300),
  providerKey: providerKeySchema
});

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

export async function upsertProviderCredential(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = upsertProviderSchema.parse({
    cadenceHours: readOptionalString(formData, "cadenceHours") || undefined,
    credentialsHint: readOptionalString(formData, "credentialsHint"),
    providerKey: formData.get("providerKey"),
    status: formData.get("status"),
    syncMode: formData.get("syncMode")
  });

  const now = new Date();
  const nextSyncAt =
    parsed.syncMode === "SCHEDULED" && parsed.status === "CONNECTED" && parsed.cadenceHours
      ? new Date(now.getTime() + parsed.cadenceHours * 60 * 60 * 1000)
      : null;

  await prisma.providerCredential.upsert({
    where: {
      companyId_providerKey: {
        companyId: session.user.companyId!,
        providerKey: parsed.providerKey
      }
    },
    update: {
      cadenceHours: parsed.syncMode === "SCHEDULED" ? parsed.cadenceHours ?? 24 : null,
      credentialsHint: parsed.credentialsHint || null,
      lastErrorAt: parsed.status === "ERROR" ? now : null,
      lastErrorMessage: parsed.status === "ERROR" ? parsed.credentialsHint || "Provider flagged as error state." : null,
      nextSyncAt,
      status: parsed.status,
      syncMode: parsed.syncMode
    },
    create: {
      cadenceHours: parsed.syncMode === "SCHEDULED" ? parsed.cadenceHours ?? 24 : null,
      companyId: session.user.companyId!,
      credentialsHint: parsed.credentialsHint || null,
      lastErrorAt: parsed.status === "ERROR" ? now : null,
      lastErrorMessage: parsed.status === "ERROR" ? parsed.credentialsHint || "Provider flagged as error state." : null,
      nextSyncAt,
      providerKey: parsed.providerKey,
      status: parsed.status,
      syncMode: parsed.syncMode
    }
  });

  revalidatePath("/providers");
  revalidatePath("/");
}

export async function markProviderSync(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = providerActionSchema.parse({
    providerKey: formData.get("providerKey")
  });

  const syncTime = new Date();
  const mockImportedCount =
    parsed.providerKey === "mobile-de" ? 12 : parsed.providerKey === "autoscout24" ? 8 : 1;

  const existingCredential = await prisma.providerCredential.findUnique({
    where: {
      companyId_providerKey: {
        companyId: session.user.companyId!,
        providerKey: parsed.providerKey
      }
    }
  });

  const nextScheduledSyncAt =
    existingCredential?.syncMode === "SCHEDULED" &&
    existingCredential.cadenceHours &&
    existingCredential.status === "CONNECTED"
      ? new Date(syncTime.getTime() + existingCredential.cadenceHours * 60 * 60 * 1000)
      : existingCredential?.nextSyncAt ?? null;

  await prisma.providerCredential.upsert({
    where: {
      companyId_providerKey: {
        companyId: session.user.companyId!,
        providerKey: parsed.providerKey
      }
    },
    update: {
      lastErrorAt: null,
      lastErrorMessage: null,
      lastSyncAt: syncTime,
      nextSyncAt: nextScheduledSyncAt
    },
    create: {
      cadenceHours: null,
      companyId: session.user.companyId!,
      lastErrorAt: null,
      lastErrorMessage: null,
      nextSyncAt: null,
      providerKey: parsed.providerKey,
      status: "CONNECTED",
      syncMode: "MANUAL",
      lastSyncAt: syncTime
    }
  });

  await prisma.providerSyncRun.create({
    data: {
      companyId: session.user.companyId!,
      importedCount: mockImportedCount,
      message: `Manual sync recorded on ${syncTime.toLocaleString("en-US")} for ${parsed.providerKey}.`,
      providerKey: parsed.providerKey,
      status: "SUCCESS"
    }
  });

  revalidatePath("/providers");
  revalidatePath("/sync-ops");
}

export async function resetProviderCredential(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = providerActionSchema.parse({
    providerKey: formData.get("providerKey")
  });

  await prisma.providerCredential.deleteMany({
    where: {
      companyId: session.user.companyId!,
      providerKey: parsed.providerKey
    }
  });

  await prisma.providerSyncRun.create({
    data: {
      companyId: session.user.companyId!,
      importedCount: 0,
      message: `Provider setup reset on ${new Date().toLocaleString("en-US")}.`,
      providerKey: parsed.providerKey,
      status: "RESET"
    }
  });

  revalidatePath("/providers");
  revalidatePath("/");
  revalidatePath("/sync-ops");
}

export async function markProviderSyncError(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = providerErrorSchema.parse({
    message: readOptionalString(formData, "message"),
    providerKey: formData.get("providerKey")
  });

  const errorTime = new Date();

  await prisma.providerCredential.upsert({
    where: {
      companyId_providerKey: {
        companyId: session.user.companyId!,
        providerKey: parsed.providerKey
      }
    },
    update: {
      lastErrorAt: errorTime,
      lastErrorMessage: parsed.message,
      status: "ERROR"
    },
    create: {
      cadenceHours: null,
      companyId: session.user.companyId!,
      lastErrorAt: errorTime,
      lastErrorMessage: parsed.message,
      nextSyncAt: null,
      providerKey: parsed.providerKey,
      status: "ERROR",
      syncMode: "MANUAL"
    }
  });

  await prisma.providerSyncRun.create({
    data: {
      companyId: session.user.companyId!,
      importedCount: 0,
      message: parsed.message,
      providerKey: parsed.providerKey,
      status: "ERROR"
    }
  });

  revalidatePath("/providers");
  revalidatePath("/sync-ops");
}

export async function runDueProviderSyncs() {
  const session = await requireOnboardedSession();
  const dueCredentials = await prisma.providerCredential.findMany({
    where: {
      companyId: session.user.companyId!,
      status: "CONNECTED",
      syncMode: "SCHEDULED",
      nextSyncAt: {
        lte: new Date()
      }
    },
    orderBy: { nextSyncAt: "asc" }
  });

  const now = new Date();

  for (const credential of dueCredentials) {
    const importedCount =
      credential.providerKey === "mobile-de" ? 12 : credential.providerKey === "autoscout24" ? 8 : 2;
    const nextSyncAt = credential.cadenceHours
      ? new Date(now.getTime() + credential.cadenceHours * 60 * 60 * 1000)
      : null;

    await prisma.providerCredential.update({
      where: { id: credential.id },
      data: {
        lastErrorAt: null,
        lastErrorMessage: null,
        lastSyncAt: now,
        nextSyncAt
      }
    });

    await prisma.providerSyncRun.create({
      data: {
        companyId: session.user.companyId!,
        importedCount,
        message: `Scheduled sync executed on ${now.toLocaleString("en-US")} for ${credential.providerKey}.`,
        providerKey: credential.providerKey,
        status: "SUCCESS"
      }
    });
  }

  revalidatePath("/providers");
  revalidatePath("/sync-ops");
}
