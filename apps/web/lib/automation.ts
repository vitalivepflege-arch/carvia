import { prisma } from "@carvia/database";

function startOfDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export async function getAutomationWorkspace(companyId: string) {
  const [company, recentRuns, items] = await Promise.all([
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

  return {
    recentRuns,
    summary: {
      leadSyncCandidates,
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
  const previewLines: string[] = [];

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
  }

  previewLines.push(`Automation run on ${now.toLocaleString("en-US")}`);
  previewLines.push(`Updated records: ${updatedCount}`);
  previewLines.push(`Escalated overdue units: ${escalatedCount}`);
  previewLines.push(`Rules: overdue stock, live-to-lead sync, test-drive follow-up, won-to-sold sync`);

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
