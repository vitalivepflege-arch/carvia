import { prisma } from "@carvia/database";

function toNumber(value: { toString(): string } | null | undefined) {
  return value ? Number(value) : null;
}

function startOfMonth(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

export async function getManagementWorkspace(companyId: string) {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const previousMonthStart = new Date(Date.UTC(currentMonthStart.getUTCFullYear(), currentMonthStart.getUTCMonth() - 1, 1));
  const twoMonthsAgoStart = new Date(Date.UTC(currentMonthStart.getUTCFullYear(), currentMonthStart.getUTCMonth() - 2, 1));

  const [items, company, analyses] = await Promise.all([
    prisma.watchlist.findMany({
      where: { companyId },
      orderBy: [{ createdAt: "desc" }]
    }),
    prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
        minimumMarginTarget: true,
        targetDaysToSell: true
      }
    }),
    prisma.vehicleAnalysis.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 180,
      select: {
        vehicleId: true,
        projectedMargin: true,
        createdAt: true
      }
    })
  ]);

  const analysisByVehicle = new Map<string, (typeof analyses)[number]>();
  for (const analysis of analyses) {
    if (analysis.vehicleId && !analysisByVehicle.has(analysis.vehicleId)) {
      analysisByVehicle.set(analysis.vehicleId, analysis);
    }
  }

  const enrichedItems = items.map((item) => {
    const analysis = analysisByVehicle.get(item.vehicleId) ?? null;
    const buyIn = toNumber(item.latestOfferPrice) ?? toNumber(item.targetBuyPrice) ?? 0;
    const additionalCosts =
      (toNumber(item.transportCost) ?? 0) +
      (toNumber(item.reconditioningCost) ?? 0) +
      (toNumber(item.holdingCost) ?? 0) +
      (toNumber(item.miscCost) ?? 0);
    const soldRetailPrice = toNumber(item.soldRetailPrice);
    const actualMargin = soldRetailPrice !== null ? soldRetailPrice - buyIn - additionalCosts : null;
    const projectedMargin = toNumber(analysis?.projectedMargin);
    const daysInStock = Math.max(
      0,
      Math.floor(((item.soldAt ?? now).getTime() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24))
    );

    return {
      ...item,
      actualMargin,
      additionalCosts,
      buyIn,
      daysInStock,
      projectedMargin,
      soldRetailPrice
    };
  });

  const soldItems = enrichedItems.filter((item) => item.salesStatus === "WON" || item.soldAt);
  const wonDeals = enrichedItems.filter((item) => item.salesStatus === "WON").length;
  const lostDeals = enrichedItems.filter((item) => item.salesStatus === "LOST").length;
  const liveRetail = enrichedItems.filter((item) => item.retailStatus === "LIVE").length;
  const activeSales = enrichedItems.filter(
    (item) =>
      item.salesStatus === "LEAD_NEW" ||
      item.salesStatus === "RESERVATION_PENDING" ||
      item.salesStatus === "TEST_DRIVE_SCHEDULED" ||
      item.salesStatus === "NEGOTIATING"
  ).length;

  const currentMonthSold = soldItems.filter((item) => item.soldAt && item.soldAt >= currentMonthStart);
  const previousMonthSold = soldItems.filter(
    (item) => item.soldAt && item.soldAt >= previousMonthStart && item.soldAt < currentMonthStart
  );

  const currentMonthMargin = currentMonthSold.reduce((sum, item) => sum + (item.actualMargin ?? 0), 0);
  const previousMonthMargin = previousMonthSold.reduce((sum, item) => sum + (item.actualMargin ?? 0), 0);
  const currentMonthSales = currentMonthSold.reduce((sum, item) => sum + (item.soldRetailPrice ?? 0), 0);
  const previousMonthSales = previousMonthSold.reduce((sum, item) => sum + (item.soldRetailPrice ?? 0), 0);

  const monthBuckets = [twoMonthsAgoStart, previousMonthStart, currentMonthStart].map((monthStart) => {
    const nextMonth = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1));
    const monthSold = soldItems.filter((item) => item.soldAt && item.soldAt >= monthStart && item.soldAt < nextMonth);
    const monthCreated = enrichedItems.filter((item) => item.createdAt >= monthStart && item.createdAt < nextMonth);

    return {
      label: formatMonthLabel(monthStart),
      margin: monthSold.reduce((sum, item) => sum + (item.actualMargin ?? 0), 0),
      purchases: monthCreated.length,
      sales: monthSold.length,
      soldRevenue: monthSold.reduce((sum, item) => sum + (item.soldRetailPrice ?? 0), 0)
    };
  });

  const winRateBase = wonDeals + lostDeals;
  const winRate = winRateBase ? Math.round((wonDeals / winRateBase) * 100) : 0;

  const avgDaysToSell = soldItems.length
    ? soldItems.reduce((sum, item) => sum + item.daysInStock, 0) / soldItems.length
    : 0;

  const targetDays = company?.targetDaysToSell ?? 0;
  const overdueStock = targetDays
    ? enrichedItems.filter((item) => !item.soldAt && item.daysInStock > targetDays).length
    : 0;

  const minMarginTarget = toNumber(company?.minimumMarginTarget) ?? 0;
  const belowMarginCount = minMarginTarget
    ? soldItems.filter((item) => item.actualMargin !== null && item.actualMargin < minMarginTarget).length
    : 0;

  const funnelConversion = {
    fromTrackedToOffer:
      enrichedItems.length > 0
        ? Math.round(
            (enrichedItems.filter((item) => item.offerStatus !== "NONE").length / enrichedItems.length) * 100
          )
        : 0,
    fromLiveToLead:
      liveRetail > 0
        ? Math.round(
            (enrichedItems.filter((item) => item.retailStatus === "LIVE" && item.leadCount > 0).length / liveRetail) *
              100
          )
        : 0,
    fromLeadToWon:
      activeSales + wonDeals > 0 ? Math.round((wonDeals / (activeSales + wonDeals)) * 100) : 0
  };

  return {
    company,
    conversions: funnelConversion,
    monthComparison: {
      currentMonthMargin,
      currentMonthSales,
      previousMonthMargin,
      previousMonthSales
    },
    monthlyTrend: monthBuckets,
    overview: {
      activeSales,
      avgDaysToSell,
      belowMarginCount,
      liveRetail,
      overdueStock,
      winRate,
      wonDeals
    }
  };
}
