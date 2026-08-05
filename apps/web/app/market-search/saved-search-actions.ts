"use server";

import { prisma } from "@carvia/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOnboardedSession } from "../../lib/auth";

const filtersSchema = z.object({
  fuelType: z.string(),
  make: z.string(),
  model: z.string(),
  purchasePriceMax: z.string(),
  transmission: z.string()
});

const createSavedSearchSchema = z.object({
  alertEnabled: z.boolean(),
  fuelType: z.string(),
  make: z.string(),
  model: z.string(),
  name: z.string().trim().min(2).max(80),
  purchasePriceMax: z.string(),
  resultCount: z.coerce.number().int().nonnegative(),
  transmission: z.string()
});

const savedSearchIdSchema = z.object({
  savedSearchId: z.string().min(1)
});

function readString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function createSavedSearch(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = createSavedSearchSchema.parse({
    alertEnabled: formData.get("alertEnabled") === "on",
    fuelType: readString(formData, "fuelType"),
    make: readString(formData, "make"),
    model: readString(formData, "model"),
    name: readString(formData, "name"),
    purchasePriceMax: readString(formData, "purchasePriceMax"),
    resultCount: formData.get("resultCount"),
    transmission: readString(formData, "transmission")
  });

  const filters = filtersSchema.parse({
    fuelType: parsed.fuelType,
    make: parsed.make,
    model: parsed.model,
    purchasePriceMax: parsed.purchasePriceMax,
    transmission: parsed.transmission
  });

  await prisma.savedSearch.create({
    data: {
      alertEnabled: parsed.alertEnabled,
      companyId: session.user.companyId!,
      filters,
      lastRunResultCount: parsed.resultCount,
      name: parsed.name
    }
  });

  revalidatePath("/market-search");
}

export async function toggleSavedSearchAlert(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = savedSearchIdSchema.parse({
    savedSearchId: formData.get("savedSearchId")
  });

  const existing = await prisma.savedSearch.findFirst({
    where: {
      id: parsed.savedSearchId,
      companyId: session.user.companyId!
    }
  });

  if (!existing) {
    return;
  }

  await prisma.savedSearch.update({
    where: { id: existing.id },
    data: {
      alertEnabled: !existing.alertEnabled
    }
  });

  revalidatePath("/market-search");
}

export async function deleteSavedSearch(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = savedSearchIdSchema.parse({
    savedSearchId: formData.get("savedSearchId")
  });

  await prisma.savedSearch.deleteMany({
    where: {
      id: parsed.savedSearchId,
      companyId: session.user.companyId!
    }
  });

  revalidatePath("/market-search");
}
