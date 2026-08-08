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

const applyRebalanceSuggestionSchema = z.object({
  fromRole: z.enum(["OWNER", "ADMIN", "BUYER", "SALES", "VIEWER"]),
  toRole: z.enum(["OWNER", "ADMIN", "BUYER", "SALES", "VIEWER"])
});

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

async function createTeamOperationLog(input: {
  actionType: string;
  actorUserId: string;
  actorUserName: string | null;
  companyId: string;
  details: Record<string, unknown>;
  summary: string;
  targetId?: string | null;
  targetType: string;
}) {
  await prisma.teamOperationLog.create({
    data: {
      actionType: input.actionType,
      actorUserId: input.actorUserId,
      actorUserName: input.actorUserName,
      companyId: input.companyId,
      details: JSON.parse(JSON.stringify(input.details)),
      summary: input.summary,
      targetId: input.targetId ?? null,
      targetType: input.targetType
    }
  });
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

  await createTeamOperationLog({
    actionType: "TEAM_MEMBER_CREATED",
    actorUserId: session.user.id,
    actorUserName: session.user.name ?? null,
    companyId: session.user.companyId!,
    details: {
      email,
      name: parsed.name,
      role: parsed.role
    },
    summary: `Created teammate ${parsed.name} with role ${parsed.role}.`,
    targetId: email,
    targetType: "USER"
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

  const previousRole = member.role;

  await prisma.user.update({
    where: { id: member.id },
    data: {
      role: parsed.role
    }
  });

  await createTeamOperationLog({
    actionType: "TEAM_ROLE_UPDATED",
    actorUserId: session.user.id,
    actorUserName: session.user.name ?? null,
    companyId: session.user.companyId!,
    details: {
      nextRole: parsed.role,
      previousRole
    },
    summary: `Changed team member role from ${previousRole} to ${parsed.role}.`,
    targetId: member.id,
    targetType: "USER"
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

  const previousAssignment = {
    assigneeName: task.assigneeName,
    assigneeRole: task.assigneeRole,
    assigneeUserId: task.assigneeUserId
  };

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

  await createTeamOperationLog({
    actionType: "TASK_ASSIGNMENT_UPDATED",
    actorUserId: session.user.id,
    actorUserName: session.user.name ?? null,
    companyId: session.user.companyId!,
    details: {
      nextAssignment: {
        assigneeName: assigneeUser?.name ?? assigneeUser?.email ?? task.assigneeName,
        assigneeRole: assigneeUser?.role ?? parsed.assigneeRole,
        assigneeUserId: assigneeUser?.id ?? null
      },
      previousAssignment
    },
    summary: `Updated assignment for task ${task.title}.`,
    targetId: task.id,
    targetType: "TASK"
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

  const affectedCount = await prisma.watchlistTask.count({
    where: {
      assigneeRole: parsed.fromRole,
      companyId: session.user.companyId!,
      status: "OPEN"
    }
  });

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

  await createTeamOperationLog({
    actionType: "QUEUE_REBALANCED",
    actorUserId: session.user.id,
    actorUserName: session.user.name ?? null,
    companyId: session.user.companyId!,
    details: {
      affectedCount,
      fromRole: parsed.fromRole,
      toRole: parsed.toRole,
      toUserId: assigneeUser?.id ?? null
    },
    summary: `Rebalanced ${affectedCount} open tasks from ${parsed.fromRole} to ${assigneeUser?.role ?? parsed.toRole}.`,
    targetType: "QUEUE"
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

  const currentCompany = await prisma.company.findUnique({
    where: {
      id: session.user.companyId!
    },
    select: {
      adminWipLimit: true,
      buyerWipLimit: true,
      salesWipLimit: true,
      taskSlaDays: true
    }
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

  await createTeamOperationLog({
    actionType: "CAPACITY_SETTINGS_UPDATED",
    actorUserId: session.user.id,
    actorUserName: session.user.name ?? null,
    companyId: session.user.companyId!,
    details: {
      next: parsed,
      previous: currentCompany
    },
    summary: `Updated WIP and SLA settings for team operations.`,
    targetId: session.user.companyId!,
    targetType: "COMPANY"
  });

  revalidateTeamSurfaces();
}

export async function applyRebalanceSuggestion(formData: FormData) {
  const session = await requireTeamManager();
  const parsed = applyRebalanceSuggestionSchema.parse({
    fromRole: formData.get("fromRole"),
    toRole: formData.get("toRole")
  });

  const targetUser = await prisma.user.findFirst({
    where: {
      companyId: session.user.companyId!,
      role: parsed.toRole
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: {
      email: true,
      id: true,
      name: true,
      role: true
    }
  });

  const affectedCount = await prisma.watchlistTask.count({
    where: {
      assigneeRole: parsed.fromRole,
      companyId: session.user.companyId!,
      status: "OPEN"
    }
  });

  await prisma.watchlistTask.updateMany({
    where: {
      assigneeRole: parsed.fromRole,
      companyId: session.user.companyId!,
      status: "OPEN"
    },
    data: {
      assigneeName: targetUser?.name ?? targetUser?.email ?? null,
      assigneeRole: targetUser?.role ?? parsed.toRole,
      assigneeUserId: targetUser?.id ?? null
    }
  });

  await createTeamOperationLog({
    actionType: "REBALANCE_SUGGESTION_APPLIED",
    actorUserId: session.user.id,
    actorUserName: session.user.name ?? null,
    companyId: session.user.companyId!,
    details: {
      affectedCount,
      fromRole: parsed.fromRole,
      targetUserId: targetUser?.id ?? null,
      toRole: targetUser?.role ?? parsed.toRole
    },
    summary: `Applied rebalance suggestion for ${affectedCount} tasks from ${parsed.fromRole} to ${targetUser?.role ?? parsed.toRole}.`,
    targetType: "QUEUE"
  });

  revalidateTeamSurfaces();
}
