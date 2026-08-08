import { prisma } from "@carvia/database";

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

type AutomationTaskRule = {
  assigneeRole: "ADMIN" | "BUYER" | "OWNER" | "SALES";
  dueAt: Date | null;
  key: string;
  rule: string;
  title: string;
};

type AutomationTaskOutcome =
  | { kind: "created"; taskId: string }
  | { kind: "reopened"; taskId: string }
  | { kind: "kept"; taskId: string };

async function logAutomationActivity(input: {
  companyId: string;
  details?: string;
  happenedAt: Date;
  summary: string;
  watchlistId: string;
}) {
  await prisma.watchlistActivity.create({
    data: {
      companyId: input.companyId,
      createdByName: "Carvia Automation",
      details: input.details,
      happenedAt: input.happenedAt,
      summary: input.summary,
      type: "NOTE",
      watchlistId: input.watchlistId
    }
  });
}

async function upsertAutomationTask(companyId: string, watchlistId: string, rule: AutomationTaskRule): Promise<AutomationTaskOutcome> {
  const matchingAssignee = await prisma.user.findFirst({
    where: {
      companyId,
      role: rule.assigneeRole
    },
    orderBy: [{ name: "asc" }, { email: "asc" }],
    select: {
      email: true,
      id: true,
      name: true,
      role: true
    }
  });

  const fallbackAssignee = matchingAssignee
    ? null
    : await prisma.user.findFirst({
        where: {
          companyId,
          role: {
            in: ["OWNER", "ADMIN"]
          }
        },
        orderBy: [{ role: "asc" }, { name: "asc" }, { email: "asc" }],
        select: {
          email: true,
          id: true,
          name: true,
          role: true
        }
      });

  const assignee = matchingAssignee ?? fallbackAssignee;
  const existingTask = await prisma.watchlistTask.findFirst({
    where: {
      automationKey: rule.key,
      companyId,
      watchlistId
    },
    orderBy: { createdAt: "desc" }
  });

  if (!existingTask) {
    const task = await prisma.watchlistTask.create({
      data: {
        assigneeName: assignee?.name ?? assignee?.email ?? null,
        assigneeRole: assignee?.role ?? rule.assigneeRole,
        assigneeUserId: assignee?.id ?? null,
        automationKey: rule.key,
        automationRule: rule.rule,
        companyId,
        dueAt: rule.dueAt,
        origin: "AUTOMATION",
        title: rule.title,
        watchlistId
      }
    });
    return { kind: "created", taskId: task.id };
  }

  if (existingTask.status === "DONE") {
    const task = await prisma.watchlistTask.update({
      where: { id: existingTask.id },
      data: {
        assigneeName: assignee?.name ?? assignee?.email ?? existingTask.assigneeName,
        assigneeRole: assignee?.role ?? rule.assigneeRole,
        assigneeUserId: assignee?.id ?? null,
        completedAt: null,
        dueAt: rule.dueAt,
        status: "OPEN",
        title: rule.title
      }
    });
    return { kind: "reopened", taskId: task.id };
  }

  const dueAtChanged =
    existingTask.dueAt?.toISOString() !== rule.dueAt?.toISOString();

  if (dueAtChanged || existingTask.title !== rule.title) {
    await prisma.watchlistTask.update({
      where: { id: existingTask.id },
      data: {
        assigneeName: assignee?.name ?? assignee?.email ?? existingTask.assigneeName,
        assigneeRole: assignee?.role ?? rule.assigneeRole,
        assigneeUserId: assignee?.id ?? null,
        dueAt: rule.dueAt,
        title: rule.title
      }
    });
  }

  return { kind: "kept", taskId: existingTask.id };
}

async function resolveInactiveAutomationTasks(companyId: string, activeKeys: Set<string>) {
  const staleTasks = await prisma.watchlistTask.findMany({
    where: {
      companyId,
      origin: "AUTOMATION",
      status: "OPEN"
    },
    select: {
      automationKey: true,
      automationRule: true,
      id: true,
      title: true,
      watchlistId: true
    }
  });

  const staleTaskIds = staleTasks
    .filter((task) => task.automationKey && !activeKeys.has(task.automationKey))
    .map((task) => task.id);

  if (staleTaskIds.length === 0) {
    return [];
  }

  await prisma.watchlistTask.updateMany({
    where: {
      id: {
        in: staleTaskIds
      }
    },
    data: {
      completedAt: new Date(),
      status: "DONE"
    }
  });

  return staleTasks.filter((task) => staleTaskIds.includes(task.id));
}

function buildAutomationRules(item: {
  createdAt: Date;
  id: string;
  leadCount: number;
  nextActionAt: Date | null;
  retailStatus: string;
  salesStatus: string;
  testDriveScheduledAt: Date | null;
}, targetDays: number, today: Date, now: Date) {
  const rules: AutomationTaskRule[] = [];

  const daysInStock = Math.floor((now.getTime() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  if (targetDays && daysInStock > targetDays) {
    rules.push({
      assigneeRole: "BUYER",
      dueAt: today,
      key: `${item.id}:overdue-stock`,
      rule: "OVERDUE_STOCK_REVIEW",
      title: `Review aged stock and margin plan (${daysInStock} days in stock)`
    });
  }

  if (item.retailStatus === "LIVE" && item.salesStatus === "NONE" && item.leadCount > 0) {
    rules.push({
      assigneeRole: "SALES",
      dueAt: today,
      key: `${item.id}:lead-follow-up`,
      rule: "LIVE_LEAD_FOLLOW_UP",
      title: `Qualify fresh retail leads and assign a sales owner (${item.leadCount} leads)`
    });
  }

  if (item.salesStatus === "TEST_DRIVE_SCHEDULED" && item.testDriveScheduledAt) {
    rules.push({
      assigneeRole: "SALES",
      dueAt: item.testDriveScheduledAt,
      key: `${item.id}:test-drive`,
      rule: "TEST_DRIVE_PREP",
      title: "Prepare test drive follow-up and confirm buyer attendance"
    });
  }

  if (item.salesStatus === "WON") {
    rules.push({
      assigneeRole: "ADMIN",
      dueAt: today,
      key: `${item.id}:handover-close`,
      rule: "WON_DEAL_HANDOVER",
      title: "Confirm sold-unit handover, documents, and payout completion"
    });
  }

  if (item.nextActionAt && item.nextActionAt <= today) {
    rules.push({
      assigneeRole: "BUYER",
      dueAt: item.nextActionAt,
      key: `${item.id}:due-next-action`,
      rule: "DUE_NEXT_ACTION",
      title: "Execute the overdue next action for this opportunity"
    });
  }

  return rules;
}

export async function getAutomationWorkspace(companyId: string) {
  const [company, recentRuns, items, openAutomationTasks] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: {
        minimumMarginTarget: true,
        targetDaysToSell: true
      }
    }),
    prisma.automationRun.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 10
    }),
    prisma.watchlist.findMany({
      where: { companyId },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        createdAt: true,
        leadCount: true,
        nextActionAt: true,
        priority: true,
        retailStatus: true,
        salesStatus: true,
        soldAt: true,
        soldRetailPrice: true,
        testDriveScheduledAt: true,
        vehicleId: true
      }
    }),
    prisma.watchlistTask.count({
      where: {
        companyId,
        origin: "AUTOMATION",
        status: "OPEN"
      }
    })
  ]);

  const now = new Date();
  const targetDays = company?.targetDaysToSell ?? 0;

  const overdueStockCandidates = targetDays
    ? items.filter((item) => {
        const daysInStock = Math.floor(((item.soldAt ?? now).getTime() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24));
        return !item.soldAt && daysInStock > targetDays;
      }).length
    : 0;

  const leadSyncCandidates = items.filter(
    (item) => item.retailStatus === "LIVE" && item.salesStatus === "NONE" && item.leadCount > 0
  ).length;

  const testDriveCandidates = items.filter(
    (item) => item.salesStatus === "TEST_DRIVE_SCHEDULED" && item.testDriveScheduledAt && !item.nextActionAt
  ).length;

  const soldSyncCandidates = items.filter(
    (item) => item.salesStatus === "WON" && item.soldRetailPrice && !item.soldAt
  ).length;

  const dueActionCandidates = items.filter((item) => item.nextActionAt && item.nextActionAt <= startOfDay(now)).length;

  return {
    recentRuns,
    summary: {
      dueActionCandidates,
      leadSyncCandidates,
      openAutomationTasks,
      overdueStockCandidates,
      soldSyncCandidates,
      testDriveCandidates
    }
  };
}

export async function runAutomationRules(companyId: string) {
  const [company, items] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: {
        targetDaysToSell: true
      }
    }),
    prisma.watchlist.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" }
    })
  ]);

  const now = new Date();
  const today = startOfDay(now);
  const targetDays = company?.targetDaysToSell ?? 0;

  let updatedCount = 0;
  let escalatedCount = 0;
  let createdTaskCount = 0;
  let reopenedTaskCount = 0;
  let resolvedTaskCount = 0;
  const previewLines: string[] = [];
  const activeAutomationKeys = new Set<string>();

  for (const item of items) {
    const updateData: Record<string, unknown> = {};

    if (targetDays) {
      const daysInStock = Math.floor(((item.soldAt ?? now).getTime() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      if (!item.soldAt && daysInStock > targetDays) {
        if (item.priority !== "HIGH") {
          updateData.priority = "HIGH";
        }
        if (!item.nextActionAt || item.nextActionAt > today) {
          updateData.nextActionAt = today;
        }
        escalatedCount += 1;
      }
    }

    if (item.retailStatus === "LIVE" && item.salesStatus === "NONE" && item.leadCount > 0) {
      updateData.salesStatus = "LEAD_NEW";
      updateData.salesUpdatedAt = now;
    }

    if (item.salesStatus === "TEST_DRIVE_SCHEDULED" && item.testDriveScheduledAt && !item.nextActionAt) {
      updateData.nextActionAt = item.testDriveScheduledAt;
    }

    if (item.salesStatus === "WON" && item.soldRetailPrice && !item.soldAt) {
      updateData.soldAt = today;
      updateData.retailStatus = "SOLD";
      updateData.retailUpdatedAt = now;
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.watchlist.update({
        where: { id: item.id },
        data: updateData
      });
      updatedCount += 1;
    }

    const taskRules = buildAutomationRules(item, targetDays, today, now);
    for (const rule of taskRules) {
      activeAutomationKeys.add(rule.key);
      const outcome = await upsertAutomationTask(companyId, item.id, rule);
      if (outcome.kind === "created") {
        createdTaskCount += 1;
        await logAutomationActivity({
          companyId,
          details: `Rule ${rule.rule} created task "${rule.title}"${rule.dueAt ? ` due ${rule.dueAt.toLocaleDateString("en-US", { dateStyle: "long" })}` : ""}.`,
          happenedAt: now,
          summary: `Automation created follow-up task: ${rule.title}`,
          watchlistId: item.id
        });
      }
      if (outcome.kind === "reopened") {
        reopenedTaskCount += 1;
        await logAutomationActivity({
          companyId,
          details: `Rule ${rule.rule} reopened task "${rule.title}" because the trigger condition became active again.`,
          happenedAt: now,
          summary: `Automation reopened follow-up task: ${rule.title}`,
          watchlistId: item.id
        });
      }
    }
  }

  const resolvedTasks = await resolveInactiveAutomationTasks(companyId, activeAutomationKeys);
  resolvedTaskCount = resolvedTasks.length;
  for (const task of resolvedTasks) {
    await logAutomationActivity({
      companyId,
      details: `Rule ${task.automationRule ?? "UNKNOWN_RULE"} resolved task "${task.title}" because the triggering condition is no longer active.`,
      happenedAt: now,
      summary: `Automation resolved follow-up task: ${task.title}`,
      watchlistId: task.watchlistId
    });
  }

  previewLines.push(`Automation run on ${now.toLocaleString("en-US")}`);
  previewLines.push(`Updated records: ${updatedCount}`);
  previewLines.push(`Escalated overdue units: ${escalatedCount}`);
  previewLines.push(`Automation tasks created: ${createdTaskCount}`);
  previewLines.push(`Automation tasks reopened: ${reopenedTaskCount}`);
  previewLines.push(`Automation tasks resolved: ${resolvedTaskCount}`);
  previewLines.push(`Rules: overdue stock, live-to-lead sync, test-drive follow-up, won-to-sold sync, due-next-action cadence`);

  const run = await prisma.automationRun.create({
    data: {
      companyId,
      escalatedCount,
      preview: previewLines.join("\n"),
      runType: "RULE_MAINTENANCE",
      status: "COMPLETED",
      updatedCount
    }
  });

  return run;
}
