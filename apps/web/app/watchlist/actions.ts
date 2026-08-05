"use server";

import { prisma } from "@carvia/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOnboardedSession } from "../../lib/auth";

const addWatchlistSchema = z.object({
  note: z.string().trim().max(500).optional(),
  vehicleId: z.string().min(1)
});

const updateWatchlistSchema = z.object({
  note: z.string().trim().max(500).optional(),
  watchlistId: z.string().min(1)
});

const removeWatchlistSchema = z.object({
  watchlistId: z.string().min(1)
});

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

export async function addVehicleToWatchlist(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = addWatchlistSchema.parse({
    note: readOptionalString(formData, "note"),
    vehicleId: formData.get("vehicleId")
  });

  const existingItem = await prisma.watchlist.findUnique({
    where: {
      companyId_vehicleId: {
        companyId: session.user.companyId!,
        vehicleId: parsed.vehicleId
      }
    }
  });

  if (existingItem) {
    await prisma.watchlist.update({
      where: { id: existingItem.id },
      data: {
        note: parsed.note || existingItem.note
      }
    });
  } else {
    await prisma.watchlist.create({
      data: {
        companyId: session.user.companyId!,
        note: parsed.note,
        vehicleId: parsed.vehicleId
      }
    });
  }

  revalidatePath("/");
  revalidatePath("/watchlist");
}

export async function updateWatchlistNote(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = updateWatchlistSchema.parse({
    note: readOptionalString(formData, "note"),
    watchlistId: formData.get("watchlistId")
  });

  await prisma.watchlist.updateMany({
    where: {
      id: parsed.watchlistId,
      companyId: session.user.companyId!
    },
    data: {
      note: parsed.note || null
    }
  });

  revalidatePath("/watchlist");
}

export async function removeWatchlistItem(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = removeWatchlistSchema.parse({
    watchlistId: formData.get("watchlistId")
  });

  await prisma.watchlist.deleteMany({
    where: {
      id: parsed.watchlistId,
      companyId: session.user.companyId!
    }
  });

  revalidatePath("/");
  revalidatePath("/watchlist");
}
