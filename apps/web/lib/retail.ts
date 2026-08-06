import { prisma } from "@carvia/database";

export const retailStatusLabels = {
  LISTING_READY: "Listing ready",
  LIVE: "Live",
  MEDIA_PENDING: "Media pending",
  NONE: "No retail flow",
  RECONDITIONING: "Reconditioning",
  SOLD: "Sold"
} as const;

export async function getRetailWorkspace(companyId: string) {
  const items = await prisma.watchlist.findMany({
    where: { companyId },
    orderBy: [{ retailUpdatedAt: "desc" }, { closingUpdatedAt: "desc" }, { createdAt: "desc" }]
  });

  if (items.length === 0) {
    return [];
  }

  const vehicleIds = [...new Set(items.map((item) => item.vehicleId))];
  const [vehicles, analyses] = await Promise.all([
    prisma.vehicle.findMany({
      where: {
        id: {
          in: vehicleIds
        }
      },
      select: {
        id: true,
        make: true,
        model: true,
        firstRegistration: true,
        mileageKm: true,
        priceGross: true,
        country: true
      }
    }),
    prisma.vehicleAnalysis.findMany({
      where: {
        companyId,
        vehicleId: {
          in: vehicleIds
        }
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        vehicleId: true,
        estimatedTransactionPrice: true,
        projectedMargin: true,
        dealerScore: true
      }
    })
  ]);

  const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const latestAnalysisByVehicle = new Map<string, (typeof analyses)[number]>();

  for (const analysis of analyses) {
    if (analysis.vehicleId && !latestAnalysisByVehicle.has(analysis.vehicleId)) {
      latestAnalysisByVehicle.set(analysis.vehicleId, analysis);
    }
  }

  return items
    .map((item) => ({
      ...item,
      analysis: latestAnalysisByVehicle.get(item.vehicleId) ?? null,
      retailAskingPrice: item.retailAskingPrice ? Number(item.retailAskingPrice) : null,
      targetBuyPrice: item.targetBuyPrice ? Number(item.targetBuyPrice) : null,
      latestOfferPrice: item.latestOfferPrice ? Number(item.latestOfferPrice) : null,
      vehicle: vehicleMap.get(item.vehicleId) ?? null
    }))
    .filter(
      (
        item
      ): item is typeof item & {
        vehicle: NonNullable<typeof item.vehicle>;
      } => item.vehicle !== null
    )
    .map((item) => ({
      ...item,
      analysis: item.analysis
        ? {
            ...item.analysis,
            estimatedTransactionPrice: item.analysis.estimatedTransactionPrice
              ? Number(item.analysis.estimatedTransactionPrice)
              : null,
            projectedMargin: item.analysis.projectedMargin ? Number(item.analysis.projectedMargin) : null
          }
        : null,
      vehicle: {
        ...item.vehicle,
        priceGross: item.vehicle.priceGross ? Number(item.vehicle.priceGross) : null
      }
    }));
}
