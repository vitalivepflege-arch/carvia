"use server";

import { prisma } from "@carvia/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOnboardedSession } from "../../lib/auth";

const createContactSchema = z.object({
  companyName: z.string().trim().max(160).optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  fullName: z.string().trim().min(2).max(120),
  lastContactedAt: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
  phone: z.string().trim().max(60).optional(),
  preferredChannel: z.enum(["CALL", "EMAIL", "MESSAGE"]),
  roleLabel: z.string().trim().max(120).optional(),
  watchlistId: z.string().min(1)
});

const contactActionSchema = z.object({
  contactId: z.string().min(1)
});

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function revalidateContactSurfaces() {
  revalidatePath("/");
  revalidatePath("/analyses");
  revalidatePath("/contacts");
  revalidatePath("/pipeline");
  revalidatePath("/watchlist");
}

export async function createWatchlistContact(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = createContactSchema.parse({
    companyName: readOptionalString(formData, "companyName"),
    email: readOptionalString(formData, "email") ?? "",
    fullName: formData.get("fullName"),
    lastContactedAt: readOptionalString(formData, "lastContactedAt"),
    notes: readOptionalString(formData, "notes"),
    phone: readOptionalString(formData, "phone"),
    preferredChannel: formData.get("preferredChannel"),
    roleLabel: readOptionalString(formData, "roleLabel"),
    watchlistId: formData.get("watchlistId")
  });

  const watchlistItem = await prisma.watchlist.findFirst({
    where: {
      id: parsed.watchlistId,
      companyId: session.user.companyId!
    }
  });

  if (!watchlistItem) {
    return;
  }

  await prisma.watchlistContact.create({
    data: {
      companyId: session.user.companyId!,
      companyName: parsed.companyName || null,
      email: parsed.email || null,
      fullName: parsed.fullName,
      lastContactedAt: parsed.lastContactedAt ? new Date(`${parsed.lastContactedAt}T00:00:00.000Z`) : null,
      notes: parsed.notes || null,
      phone: parsed.phone || null,
      preferredChannel: parsed.preferredChannel,
      roleLabel: parsed.roleLabel || null,
      watchlistId: parsed.watchlistId
    }
  });

  revalidateContactSurfaces();
}

export async function deleteWatchlistContact(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = contactActionSchema.parse({
    contactId: formData.get("contactId")
  });

  await prisma.watchlistContact.deleteMany({
    where: {
      id: parsed.contactId,
      companyId: session.user.companyId!
    }
  });

  revalidateContactSurfaces();
}
