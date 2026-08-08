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
  const [company, teamMembers, openTasks] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: {
        adminWipLimit: true,
        buyerWipLimit: true,
        salesWipLimit: true,
        taskSlaDays: true
      }
    }),
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
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      include: {
        assigneeUser: {
          select: {
            email: true,
            name: true,
            role: true
          }
        },
        watchlist: {
          select: {
            id: true,
            priority: true,
            stage: true,
            vehicleId: true
          }
        }
      }
    })
  ]);

  const vehicleIds = [...new Set(openTasks.map((task) => task.watchlist.vehicleId))];
  const vehicles = vehicleIds.length
    ? await prisma.vehicle.findMany({
        where: {
          id: {
            in: vehicleIds
          }
        },
        select: {
          id: true,
          make: true,
          model: true
        }
      })
    : [];
  const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));

  const today = new Date(new Date().toDateString());
  const slaDays = company?.taskSlaDays ?? 2;
  const slaThreshold = new Date(today.getTime() - slaDays * 24 * 60 * 60 * 1000);
  const taskCountsByUser = new Map<string, { automation: number; open: number; overdue: number }>();
  const roleLoad = {
    ADMIN: { automation: 0, open: 0, overdue: 0, stale: 0 },
    BUYER: { automation: 0, open: 0, overdue: 0, stale: 0 },
    OWNER: { automation: 0, open: 0, overdue: 0, stale: 0 },
    SALES: { automation: 0, open: 0, overdue: 0, stale: 0 },
    VIEWER: { automation: 0, open: 0, overdue: 0, stale: 0 }
  };

  for (const task of openTasks) {
    const roleKey = task.assigneeRole ?? "VIEWER";
    if (!task.assigneeUserId) {
      roleLoad[roleKey].open += 1;
      if (task.origin === "AUTOMATION") {
        roleLoad[roleKey].automation += 1;
      }
      if (task.dueAt && task.dueAt < today) {
        roleLoad[roleKey].overdue += 1;
      }
      if (task.createdAt < slaThreshold) {
        roleLoad[roleKey].stale += 1;
      }
      continue;
    }

    const current = taskCountsByUser.get(task.assigneeUserId) ?? {
      automation: 0,
      open: 0,
      overdue: 0
    };

    current.open += 1;
    roleLoad[roleKey].open += 1;
    if (task.origin === "AUTOMATION") {
      current.automation += 1;
      roleLoad[roleKey].automation += 1;
    }
    if (task.dueAt && task.dueAt < today) {
      current.overdue += 1;
      roleLoad[roleKey].overdue += 1;
    }
    if (task.createdAt < slaThreshold) {
      roleLoad[roleKey].stale += 1;
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

  const roleCapacity = [
    {
      currentLoad: roleLoad.BUYER.open,
      label: "Buyer",
      limit: company?.buyerWipLimit ?? 12,
      overdue: roleLoad.BUYER.overdue,
      role: "BUYER" as const,
      stale: roleLoad.BUYER.stale
    },
    {
      currentLoad: roleLoad.SALES.open,
      label: "Sales",
      limit: company?.salesWipLimit ?? 10,
      overdue: roleLoad.SALES.overdue,
      role: "SALES" as const,
      stale: roleLoad.SALES.stale
    },
    {
      currentLoad: roleLoad.ADMIN.open + roleLoad.OWNER.open,
      label: "Admin",
      limit: company?.adminWipLimit ?? 8,
      overdue: roleLoad.ADMIN.overdue + roleLoad.OWNER.overdue,
      role: "ADMIN" as const,
      stale: roleLoad.ADMIN.stale + roleLoad.OWNER.stale
    }
  ].map((entry) => ({
    ...entry,
    health:
      entry.currentLoad > entry.limit || entry.overdue >= 3 || entry.stale >= 2
        ? "critical"
        : entry.currentLoad >= Math.max(1, entry.limit - 1) || entry.overdue > 0
          ? "warning"
          : "healthy"
  }));

  const lightestRole = [...roleCapacity].sort((a, b) => a.currentLoad - b.currentLoad)[0];
  const rebalanceSuggestions = roleCapacity
    .filter((role) => role.health !== "healthy")
    .map((role) => ({
      affectedTaskCount: openTasks.filter((task) => (task.assigneeRole ?? "VIEWER") === role.role).length,
      fromRole: role.role,
      reason:
        role.currentLoad > role.limit
          ? `${role.label} queue is above WIP limit (${role.currentLoad}/${role.limit}).`
          : role.stale > 0
            ? `${role.label} queue has ${role.stale} tasks beyond the ${slaDays}-day SLA.`
            : `${role.label} queue has ${role.overdue} overdue follow-ups.`,
      toRole: lightestRole.role
    }));

  return {
    capacitySettings: {
      adminWipLimit: company?.adminWipLimit ?? 8,
      buyerWipLimit: company?.buyerWipLimit ?? 12,
      salesWipLimit: company?.salesWipLimit ?? 10,
      taskSlaDays: slaDays
    },
    overview: {
      adminCount: roleSummary.ADMIN + roleSummary.OWNER,
      automationAssignedCount: openTasks.filter((task) => task.origin === "AUTOMATION").length,
      buyerCount: roleSummary.BUYER,
      openTaskCount: openTasks.length,
      salesCount: roleSummary.SALES,
      teamCount: teamMembers.length
    },
    rebalanceSuggestions,
    roleCapacity,
    roleSummary,
    taskBoard: openTasks.slice(0, 12).map((task) => ({
      ...task,
      assigneeLabel: buildAssigneeLabel({
        assigneeName: task.assigneeName,
        assigneeRole: task.assigneeRole,
        assigneeUser: task.assigneeUser
      }),
      vehicle: vehicleMap.get(task.watchlist.vehicleId) ?? null
    })),
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
