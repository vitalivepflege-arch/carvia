import { prisma } from "@carvia/database";

export const userRoleLabels = {
  ADMIN: "Admin",
  BUYER: "Buyer",
  OWNER: "Owner",
  SALES: "Sales",
  VIEWER: "Viewer"
} as const;

export async function getCompanyTeamRoster(companyId: string) {
  return prisma.user.findMany({
    where: { companyId },
    orderBy: [{ role: "asc" }, { name: "asc" }, { email: "asc" }],
    select: {
      email: true,
      id: true,
      name: true,
      role: true
    }
  });
}

export function buildAssigneeLabel(input: {
  assigneeName: string | null;
  assigneeRole: keyof typeof userRoleLabels | null;
  assigneeUser: { email: string; name: string | null; role: keyof typeof userRoleLabels } | null;
}) {
  if (input.assigneeUser) {
    return `${input.assigneeUser.name ?? input.assigneeUser.email} (${userRoleLabels[input.assigneeUser.role]})`;
  }

  if (input.assigneeName && input.assigneeRole) {
    return `${input.assigneeName} (${userRoleLabels[input.assigneeRole]})`;
  }

  if (input.assigneeRole) {
    return userRoleLabels[input.assigneeRole];
  }

  return input.assigneeName ?? "Unassigned";
}

export async function getTeamWorkspace(companyId: string) {
  const [teamMembers, openTasks] = await Promise.all([
    prisma.user.findMany({
      where: { companyId },
      orderBy: [{ role: "asc" }, { name: "asc" }, { email: "asc" }],
      select: {
        createdAt: true,
        email: true,
        id: true,
        name: true,
        onboardingCompletedAt: true,
        role: true
      }
    }),
    prisma.watchlistTask.findMany({
      where: {
        companyId,
        status: "OPEN"
      },
      select: {
        assigneeRole: true,
        assigneeUserId: true,
        dueAt: true,
        origin: true
      }
    })
  ]);

  const today = new Date(new Date().toDateString());
  const taskCountsByUser = new Map<string, { automation: number; open: number; overdue: number }>();

  for (const task of openTasks) {
    if (!task.assigneeUserId) {
      continue;
    }

    const current = taskCountsByUser.get(task.assigneeUserId) ?? {
      automation: 0,
      open: 0,
      overdue: 0
    };

    current.open += 1;
    if (task.origin === "AUTOMATION") {
      current.automation += 1;
    }
    if (task.dueAt && task.dueAt < today) {
      current.overdue += 1;
    }

    taskCountsByUser.set(task.assigneeUserId, current);
  }

  const roleSummary = {
    ADMIN: 0,
    BUYER: 0,
    OWNER: 0,
    SALES: 0,
    VIEWER: 0
  };

  for (const member of teamMembers) {
    roleSummary[member.role] += 1;
  }

  return {
    overview: {
      adminCount: roleSummary.ADMIN + roleSummary.OWNER,
      automationAssignedCount: openTasks.filter((task) => task.origin === "AUTOMATION").length,
      buyerCount: roleSummary.BUYER,
      openTaskCount: openTasks.length,
      salesCount: roleSummary.SALES,
      teamCount: teamMembers.length
    },
    roleSummary,
    teamMembers: teamMembers.map((member) => ({
      ...member,
      workload: taskCountsByUser.get(member.id) ?? {
        automation: 0,
        open: 0,
        overdue: 0
      }
    }))
  };
}
