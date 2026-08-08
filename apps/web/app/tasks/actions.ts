"use server";

import { prisma } from "@carvia/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOnboardedSession } from "../../lib/auth";

const createTaskSchema = z.object({
  assigneeName: z.string().trim().max(120).optional(),
  dueAt: z.string().optional(),
  title: z.string().trim().min(3).max(180),
  watchlistId: z.string().min(1)
});

const taskActionSchema = z.object({
  taskId: z.string().min(1)
});

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function revalidateTaskSurfaces() {
  revalidatePath("/");
  revalidatePath("/alerts");
  revalidatePath("/automation-ops");
  revalidatePath("/pipeline");
  revalidatePath("/tasks");
  revalidatePath("/watchlist");
}

export async function createWatchlistTask(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = createTaskSchema.parse({
    assigneeName: readOptionalString(formData, "assigneeName"),
    dueAt: readOptionalString(formData, "dueAt"),
    title: formData.get("title"),
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

  await prisma.watchlistTask.create({
    data: {
      assigneeName: parsed.assigneeName || session.user.name || null,
      companyId: session.user.companyId!,
      dueAt: parsed.dueAt ? new Date(`${parsed.dueAt}T00:00:00.000Z`) : null,
      title: parsed.title,
      watchlistId: parsed.watchlistId
    }
  });

  revalidateTaskSurfaces();
}

export async function completeWatchlistTask(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = taskActionSchema.parse({
    taskId: formData.get("taskId")
  });

  await prisma.watchlistTask.updateMany({
    where: {
      id: parsed.taskId,
      companyId: session.user.companyId!
    },
    data: {
      completedAt: new Date(),
      status: "DONE"
    }
  });

  revalidateTaskSurfaces();
}

export async function reopenWatchlistTask(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = taskActionSchema.parse({
    taskId: formData.get("taskId")
  });

  await prisma.watchlistTask.updateMany({
    where: {
      id: parsed.taskId,
      companyId: session.user.companyId!
    },
    data: {
      completedAt: null,
      status: "OPEN"
    }
  });

  revalidateTaskSurfaces();
}

export async function deleteWatchlistTask(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = taskActionSchema.parse({
    taskId: formData.get("taskId")
  });

  await prisma.watchlistTask.deleteMany({
    where: {
      id: parsed.taskId,
      companyId: session.user.companyId!
    }
  });

  revalidateTaskSurfaces();
}
