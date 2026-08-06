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

const upsertProviderSchema = z.object({
  credentialsHint: z.string().trim().max(500).optional(),
  providerKey: providerKeySchema,
  status: providerStatusSchema
});

const providerActionSchema = z.object({
  providerKey: providerKeySchema
});

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

export async function upsertProviderCredential(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = upsertProviderSchema.parse({
    credentialsHint: readOptionalString(formData, "credentialsHint"),
    providerKey: formData.get("providerKey"),
    status: formData.get("status")
  });

  await prisma.providerCredential.upsert({
    where: {
      companyId_providerKey: {
        companyId: session.user.companyId!,
        providerKey: parsed.providerKey
      }
    },
    update: {
      credentialsHint: parsed.credentialsHint || null,
      status: parsed.status
    },
    create: {
      companyId: session.user.companyId!,
      credentialsHint: parsed.credentialsHint || null,
      providerKey: parsed.providerKey,
      status: parsed.status
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

  const syncTime = new Date("2026-08-06T08:00:00.000Z");
  const mockImportedCount =
    parsed.providerKey === "mobile-de" ? 12 : parsed.providerKey === "autoscout24" ? 8 : 1;

  await prisma.providerCredential.upsert({
    where: {
      companyId_providerKey: {
        companyId: session.user.companyId!,
        providerKey: parsed.providerKey
      }
    },
    update: {
      lastSyncAt: syncTime
    },
    create: {
      companyId: session.user.companyId!,
      providerKey: parsed.providerKey,
      status: "CONNECTED",
      lastSyncAt: syncTime
    }
  });

  await prisma.providerSyncRun.create({
    data: {
      companyId: session.user.companyId!,
      importedCount: mockImportedCount,
      message: `Manual sync recorded on August 6, 2026 for ${parsed.providerKey}.`,
      providerKey: parsed.providerKey,
      status: "SUCCESS"
    }
  });

  revalidatePath("/providers");
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
      message: `Provider setup reset on August 6, 2026.`,
      providerKey: parsed.providerKey,
      status: "RESET"
    }
  });

  revalidatePath("/providers");
  revalidatePath("/");
}
