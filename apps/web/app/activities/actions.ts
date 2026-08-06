"use server";

import { prisma } from "@carvia/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOnboardedSession } from "../../lib/auth";

const createActivitySchema = z.object({
  details: z.string().trim().max(2000).optional(),
  happenedAt: z.string().optional(),
  summary: z.string().trim().min(3).max(180),
  type: z.enum(["CALL", "EMAIL", "MESSAGE", "DOCUMENT", "MEETING", "NOTE"]),
  watchlistId: z.string().min(1)
});

const activityActionSchema = z.object({
  activityId: z.string().min(1)
});

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function revalidateActivitySurfaces() {
  revalidatePath("/");
  revalidatePath("/activities");
  revalidatePath("/alerts");
  revalidatePath("/analyses");
  revalidatePath("/pipeline");
  revalidatePath("/tasks");
  revalidatePath("/watchlist");
}

export async function createWatchlistActivity(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = createActivitySchema.parse({
    details: readOptionalString(formData, "details"),
    happenedAt: readOptionalString(formData, "happenedAt"),
    summary: formData.get("summary"),
    type: formData.get("type"),
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

  await prisma.watchlistActivity.create({
    data: {
      companyId: session.user.companyId!,
      createdByName: session.user.name || null,
      details: parsed.details || null,
      happenedAt: parsed.happenedAt ? new Date(`${parsed.happenedAt}T00:00:00.000Z`) : new Date(),
      summary: parsed.summary,
      type: parsed.type,
      watchlistId: parsed.watchlistId
    }
  });

  revalidateActivitySurfaces();
}

export async function deleteWatchlistActivity(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = activityActionSchema.parse({
    activityId: formData.get("activityId")
  });

  await prisma.watchlistActivity.deleteMany({
    where: {
      id: parsed.activityId,
      companyId: session.user.companyId!
    }
  });

  revalidateActivitySurfaces();
}
