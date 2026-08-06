import { prisma } from "@carvia/database";

function toNumber(value: { toString(): string } | null | undefined) {
  return value ? Number(value) : null;
}

export async function getInventoryWorkspace(companyId: string) {
  const [items, analyses, company] = await Promise.all([
    prisma.watchlist.findMany({
      where: { companyId },
      orderBy: [{ inventoryUpdatedAt: "desc" }, { retailUpdatedAt: "desc" }, { createdAt: "desc" }]
    }),
    prisma.vehicleAnalysis.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 120,
      select: {
        vehicleId: true,
        projectedMargin: true,
        estimatedTransactionPrice: true
      }
    }),
    prisma.company.findUnique({
      where: { id: companyId },
      select: {
        minimumMarginTarget: true,
        targetDaysToSell: true
      }
    })
  ]);

  if (items.length === 0) {
    return {
      company,
      items: [],
      summary: {
        averageDaysInStock: 0,
        capitalAtRisk: 0,
        overTargetDaysCount: 0,
        totalAdditionalCosts: 0,
        unitsWithNegativeVariance: 0
      }
    };
  }

  const vehicleIds = [...new Set(items.map((item) => item.vehicleId))];
  const vehicles = await prisma.vehicle.findMany({
    where: { id: { in: vehicleIds } },
    select: {
      id: true,
      make: true,
      model: true,
      firstRegistration: true,
      mileageKm: true,
      country: true
    }
  });

  const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const latestAnalysisByVehicle = new Map<string, (typeof analyses)[number]>();

  for (const analysis of analyses) {
    if (analysis.vehicleId && !latestAnalysisByVehicle.has(analysis.vehicleId)) {
      latestAnalysisByVehicle.set(analysis.vehicleId, analysis);
    }
  }

  const enrichedItems = items
    .map((item) => {
      const analysis = latestAnalysisByVehicle.get(item.vehicleId) ?? null;
      const buyIn = toNumber(item.latestOfferPrice) ?? toNumber(item.targetBuyPrice) ?? 0;
      const transportCost = toNumber(item.transportCost) ?? 0;
      const reconditioningCost = toNumber(item.reconditioningCost) ?? 0;
      const holdingCost = toNumber(item.holdingCost) ?? 0;
      const miscCost = toNumber(item.miscCost) ?? 0;
      const additionalCosts = transportCost + reconditioningCost + holdingCost + miscCost;
      const totalInvestment = buyIn + additionalCosts;
      const retailAsk = toNumber(item.retailAskingPrice);
      const soldRetailPrice = toNumber(item.soldRetailPrice);
      const actualMargin =
        soldRetailPrice !== null
          ? soldRetailPrice - totalInvestment
          : retailAsk !== null
            ? retailAsk - totalInvestment
            : null;
      const daysInStock = Math.max(
        0,
        Math.floor(((item.soldAt ?? new Date()).getTime() - item.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      );

      return {
        ...item,
        actualMargin,
        additionalCosts,
        analysis: analysis
          ? {
              ...analysis,
              estimatedTransactionPrice: analysis.estimatedTransactionPrice ? Number(analysis.estimatedTransactionPrice) : null,
              projectedMargin: analysis.projectedMargin ? Number(analysis.projectedMargin) : null
            }
          : null,
        buyIn,
        daysInStock,
        holdingCost,
        miscCost,
        reconditioningCost,
        retailAsk,
        soldRetailPrice,
        totalInvestment,
        transportCost,
        vehicle: vehicleMap.get(item.vehicleId) ?? null
      };
    })
    .filter(
      (
        item
      ): item is typeof item & {
        vehicle: NonNullable<typeof item.vehicle>;
      } => item.vehicle !== null
    );

  const averageDaysInStock = enrichedItems.length
    ? enrichedItems.reduce((sum, item) => sum + item.daysInStock, 0) / enrichedItems.length
    : 0;
  const capitalAtRisk = enrichedItems
    .filter((item) => item.salesStatus !== "WON")
    .reduce((sum, item) => sum + item.totalInvestment, 0);
  const totalAdditionalCosts = enrichedItems.reduce((sum, item) => sum + item.additionalCosts, 0);
  const targetDays = company?.targetDaysToSell ?? 0;
  const overTargetDaysCount = targetDays
    ? enrichedItems.filter((item) => item.daysInStock > targetDays).length
    : 0;
  const unitsWithNegativeVariance = enrichedItems.filter((item) => {
    if (item.analysis?.projectedMargin === null || item.analysis?.projectedMargin === undefined) {
      return false;
    }
    if (item.actualMargin === null) {
      return false;
    }
    return item.actualMargin < item.analysis.projectedMargin;
  }).length;

  return {
    company,
    items: enrichedItems,
    summary: {
      averageDaysInStock,
      capitalAtRisk,
      overTargetDaysCount,
      totalAdditionalCosts,
      unitsWithNegativeVariance
    }
  };
}
