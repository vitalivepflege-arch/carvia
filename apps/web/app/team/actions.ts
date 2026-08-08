"use server";

import { prisma } from "@carvia/database";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOnboardedSession } from "../../lib/auth";

const createTeamMemberSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(2).max(120),
  password: z.string().min(8),
  role: z.enum(["OWNER", "ADMIN", "BUYER", "SALES", "VIEWER"])
});

const updateTeamRoleSchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "BUYER", "SALES", "VIEWER"]),
  userId: z.string().min(1)
});

const updateTaskAssignmentSchema = z.object({
  assigneeRole: z.enum(["OWNER", "ADMIN", "BUYER", "SALES", "VIEWER"]),
  assigneeUserId: z.string().optional(),
  taskId: z.string().min(1)
});

const bulkTaskAssignmentSchema = z.object({
  fromRole: z.enum(["OWNER", "ADMIN", "BUYER", "SALES", "VIEWER"]),
  toRole: z.enum(["OWNER", "ADMIN", "BUYER", "SALES", "VIEWER"]),
  toUserId: z.string().optional()
});

const updateCapacitySettingsSchema = z.object({
  adminWipLimit: z.coerce.number().int().positive(),
  buyerWipLimit: z.coerce.number().int().positive(),
  salesWipLimit: z.coerce.number().int().positive(),
  taskSlaDays: z.coerce.number().int().positive()
});

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

function revalidateTeamSurfaces() {
  revalidatePath("/");
  revalidatePath("/alerts");
  revalidatePath("/automation-ops");
  revalidatePath("/tasks");
  revalidatePath("/team");
  revalidatePath("/watchlist");
}

async function requireTeamManager() {
  const session = await requireOnboardedSession();

  if (session.user.role !== "OWNER" && session.user.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }

  return session;
}

export async function createTeamMember(formData: FormData) {
  const session = await requireTeamManager();
  const parsed = createTeamMemberSchema.parse({
    email: formData.get("email"),
    name: formData.get("name"),
    password: formData.get("password"),
    role: formData.get("role")
  });

  const email = parsed.email.toLowerCase();
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return;
  }

  await prisma.user.create({
    data: {
      companyId: session.user.companyId!,
      email,
      name: parsed.name,
      onboardingCompletedAt: new Date(),
      passwordHash: await hash(parsed.password, 12),
      role: parsed.role
    }
  });

  revalidateTeamSurfaces();
}

export async function updateTeamMemberRole(formData: FormData) {
  const session = await requireTeamManager();
  const parsed = updateTeamRoleSchema.parse({
    role: formData.get("role"),
    userId: formData.get("userId")
  });

  const member = await prisma.user.findFirst({
    where: {
      companyId: session.user.companyId!,
      id: parsed.userId
    },
    select: {
      id: true,
      role: true
    }
  });

  if (!member) {
    return;
  }

  if (member.id === session.user.id && parsed.role === "VIEWER") {
    return;
  }

  await prisma.user.update({
    where: { id: member.id },
    data: {
      role: parsed.role
    }
  });

  revalidateTeamSurfaces();
}

export async function updateTaskAssignment(formData: FormData) {
  const session = await requireTeamManager();
  const parsed = updateTaskAssignmentSchema.parse({
    assigneeRole: formData.get("assigneeRole"),
    assigneeUserId: readOptionalString(formData, "assigneeUserId"),
    taskId: formData.get("taskId")
  });

  const task = await prisma.watchlistTask.findFirst({
    where: {
      companyId: session.user.companyId!,
      id: parsed.taskId
    }
  });

  if (!task) {
    return;
  }

  const assigneeUser = parsed.assigneeUserId
    ? await prisma.user.findFirst({
        where: {
          companyId: session.user.companyId!,
          id: parsed.assigneeUserId
        },
        select: {
          email: true,
          id: true,
          name: true,
          role: true
        }
      })
    : null;

  await prisma.watchlistTask.update({
    where: { id: task.id },
    data: {
      assigneeName: assigneeUser?.name ?? assigneeUser?.email ?? task.assigneeName,
      assigneeRole: assigneeUser?.role ?? parsed.assigneeRole,
      assigneeUserId: assigneeUser?.id ?? null
    }
  });

  revalidateTeamSurfaces();
}

export async function bulkAssignRoleQueue(formData: FormData) {
  const session = await requireTeamManager();
  const parsed = bulkTaskAssignmentSchema.parse({
    fromRole: formData.get("fromRole"),
    toRole: formData.get("toRole"),
    toUserId: readOptionalString(formData, "toUserId")
  });

  const assigneeUser = parsed.toUserId
    ? await prisma.user.findFirst({
        where: {
          companyId: session.user.companyId!,
          id: parsed.toUserId
        },
        select: {
          email: true,
          id: true,
          name: true,
          role: true
        }
      })
    : null;

  await prisma.watchlistTask.updateMany({
    where: {
      assigneeRole: parsed.fromRole,
      companyId: session.user.companyId!,
      status: "OPEN"
    },
    data: {
      assigneeName: assigneeUser?.name ?? assigneeUser?.email ?? null,
      assigneeRole: assigneeUser?.role ?? parsed.toRole,
      assigneeUserId: assigneeUser?.id ?? null
    }
  });

  revalidateTeamSurfaces();
}

export async function updateCapacitySettings(formData: FormData) {
  const session = await requireTeamManager();
  const parsed = updateCapacitySettingsSchema.parse({
    adminWipLimit: formData.get("adminWipLimit"),
    buyerWipLimit: formData.get("buyerWipLimit"),
    salesWipLimit: formData.get("salesWipLimit"),
    taskSlaDays: formData.get("taskSlaDays")
  });

  await prisma.company.update({
    where: {
      id: session.user.companyId!
    },
    data: {
      adminWipLimit: parsed.adminWipLimit,
      buyerWipLimit: parsed.buyerWipLimit,
      salesWipLimit: parsed.salesWipLimit,
      taskSlaDays: parsed.taskSlaDays
    }
  });

  revalidateTeamSurfaces();
}
