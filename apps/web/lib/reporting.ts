import { prisma } from "@carvia/database";

function toNumber(value: { toString(): string } | null | undefined) {
  return value ? Number(value) : null;
}

function getEstimatedBuyIn(item: {
  latestOfferPrice: { toString(): string } | null;
  targetBuyPrice: { toString(): string } | null;
}) {
  return toNumber(item.latestOfferPrice) ?? toNumber(item.targetBuyPrice) ?? 0;
}

export async function getReportingWorkspace(companyId: string) {
  const [items, recentAnalyses] = await Promise.all([
    prisma.watchlist.findMany({
      where: { companyId },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      include: {
        company: {
          select: {
            minimumMarginTarget: true,
            targetDaysToSell: true
          }
        }
      }
    }),
    prisma.vehicleAnalysis.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 120,
      select: {
        vehicleId: true,
        projectedMargin: true,
        confidence: true,
        dealerScore: true,
        createdAt: true
      }
    })
  ]);

  if (items.length === 0) {
    return {
      bottlenecks: [],
      finance: {
        averageProjectedMargin: 0,
        liveRetailValue: 0,
        potentialRetailValue: 0,
        targetMarginGapCount: 0
      },
      funnel: {
        activeClosings: 0,
        activeOffers: 0,
        activeRetail: 0,
        completedClosings: 0,
        liveListings: 0,
        negotiating: 0,
        readyToBuy: 0,
        soldUnits: 0,
        totalTracked: 0
      },
      stageDistribution: [],
      upcomingActions: []
    };
  }

  const vehicleIds = [...new Set(items.map((item) => item.vehicleId))];
  const vehicles = await prisma.vehicle.findMany({
    where: {
      id: {
        in: vehicleIds
      }
    },
    select: {
      id: true,
      make: true,
      model: true,
      country: true,
      mileageKm: true,
      firstRegistration: true
    }
  });

  const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const latestAnalysisByVehicle = new Map<string, (typeof recentAnalyses)[number]>();

  for (const analysis of recentAnalyses) {
    if (analysis.vehicleId && !latestAnalysisByVehicle.has(analysis.vehicleId)) {
      latestAnalysisByVehicle.set(analysis.vehicleId, analysis);
    }
  }

  const enrichedItems = items.map((item) => {
    const analysis = latestAnalysisByVehicle.get(item.vehicleId) ?? null;
    const retailAsk = toNumber(item.retailAskingPrice);
    const projectedMargin = toNumber(analysis?.projectedMargin);
    const estimatedBuyIn = getEstimatedBuyIn(item);

    return {
      ...item,
      analysis: analysis
        ? {
            ...analysis,
            projectedMargin
          }
        : null,
      estimatedBuyIn,
      retailAsk,
      vehicle: vehicleMap.get(item.vehicleId) ?? null
    };
  });

  const totalTracked = enrichedItems.length;
  const negotiating = enrichedItems.filter((item) => item.stage === "NEGOTIATING").length;
  const readyToBuy = enrichedItems.filter((item) => item.stage === "READY_TO_BUY").length;
  const activeOffers = enrichedItems.filter(
    (item) => item.offerStatus === "OFFER_SENT" || item.offerStatus === "COUNTER_RECEIVED"
  ).length;
  const activeClosings = enrichedItems.filter(
    (item) =>
      item.closingStatus === "PAPERWORK_PENDING" ||
      item.closingStatus === "PAYMENT_PENDING" ||
      item.closingStatus === "TRANSPORT_BOOKED"
  ).length;
  const completedClosings = enrichedItems.filter((item) => item.closingStatus === "COMPLETED").length;
  const activeRetail = enrichedItems.filter(
    (item) =>
      item.retailStatus === "RECONDITIONING" ||
      item.retailStatus === "MEDIA_PENDING" ||
      item.retailStatus === "LISTING_READY" ||
      item.retailStatus === "LIVE"
  ).length;
  const liveListings = enrichedItems.filter((item) => item.retailStatus === "LIVE").length;
  const soldUnits = enrichedItems.filter((item) => item.retailStatus === "SOLD").length;

  const projectedMarginValues = enrichedItems
    .map((item) => item.analysis?.projectedMargin ?? null)
    .filter((value): value is number => value !== null);
  const averageProjectedMargin = projectedMarginValues.length
    ? projectedMarginValues.reduce((sum, value) => sum + value, 0) / projectedMarginValues.length
    : 0;

  const potentialRetailValue = enrichedItems.reduce((sum, item) => sum + (item.retailAsk ?? 0), 0);
  const liveRetailValue = enrichedItems
    .filter((item) => item.retailStatus === "LIVE")
    .reduce((sum, item) => sum + (item.retailAsk ?? 0), 0);

  const minimumMarginTarget = toNumber(enrichedItems[0]?.company.minimumMarginTarget) ?? 0;
  const targetMarginGapCount = minimumMarginTarget
    ? enrichedItems.filter((item) => {
        const margin = item.analysis?.projectedMargin ?? null;
        return margin !== null && margin < minimumMarginTarget;
      }).length
    : 0;

  const bottlenecks = [
    {
      count: enrichedItems.filter(
        (item) => item.offerStatus === "ACCEPTED" && item.closingStatus === "NONE"
      ).length,
      label: "Accepted deals without closing start",
      tone: "warning" as const
    },
    {
      count: enrichedItems.filter(
        (item) => item.closingStatus === "COMPLETED" && item.retailStatus === "NONE"
      ).length,
      label: "Bought vehicles without retail plan",
      tone: "warning" as const
    },
    {
      count: enrichedItems.filter(
        (item) => item.retailStatus === "LISTING_READY" && !item.listingPublishedAt
      ).length,
      label: "Listings ready but not live",
      tone: "info" as const
    },
    {
      count: enrichedItems.filter((item) => item.nextActionAt && item.nextActionAt <= new Date()).length,
      label: "Opportunities with overdue next action",
      tone: "danger" as const
    }
  ];

  const stageDistribution = [
    { label: "New", value: enrichedItems.filter((item) => item.stage === "NEW").length },
    { label: "Reviewing", value: enrichedItems.filter((item) => item.stage === "REVIEWING").length },
    { label: "Negotiating", value: negotiating },
    { label: "Ready to buy", value: readyToBuy },
    { label: "Passed", value: enrichedItems.filter((item) => item.stage === "PASSED").length }
  ];

  const upcomingActions = enrichedItems
    .filter((item) => item.vehicle)
    .sort((left, right) => {
      const leftTime = left.nextActionAt ? left.nextActionAt.getTime() : Number.MAX_SAFE_INTEGER;
      const rightTime = right.nextActionAt ? right.nextActionAt.getTime() : Number.MAX_SAFE_INTEGER;
      return leftTime - rightTime;
    })
    .slice(0, 6)
    .map((item) => ({
      closingStatus: item.closingStatus,
      nextActionAt: item.nextActionAt,
      priority: item.priority,
      retailStatus: item.retailStatus,
      stage: item.stage,
      vehicle: item.vehicle!,
      projectedMargin: item.analysis?.projectedMargin ?? null
    }));

  return {
    bottlenecks,
    finance: {
      averageProjectedMargin,
      liveRetailValue,
      potentialRetailValue,
      targetMarginGapCount
    },
    funnel: {
      activeClosings,
      activeOffers,
      activeRetail,
      completedClosings,
      liveListings,
      negotiating,
      readyToBuy,
      soldUnits,
      totalTracked
    },
    stageDistribution,
    upcomingActions
  };
}
