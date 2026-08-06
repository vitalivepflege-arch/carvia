import { prisma } from "@carvia/database";

export type AnalysisFilter = "all" | "tracked" | "untracked";
export type AnalysisScoreBand = "all" | "high" | "medium" | "low";
export type AnalysisSort = "newest" | "score" | "margin";

export function readAnalysisFilter(value: string | string[] | undefined): AnalysisFilter {
  return value === "tracked" || value === "untracked" ? value : "all";
}

export function readAnalysisScoreBand(value: string | string[] | undefined): AnalysisScoreBand {
  return value === "high" || value === "medium" || value === "low" ? value : "all";
}

export function readAnalysisSort(value: string | string[] | undefined): AnalysisSort {
  return value === "score" || value === "margin" ? value : "newest";
}

export async function getAnalysisWorkspace(companyId: string) {
  const analyses = await prisma.vehicleAnalysis.findMany({
    where: { companyId },
    orderBy: { createdAt: "desc" }
  });

  if (analyses.length === 0) {
    return [];
  }

  const vehicleIds = analyses
    .map((analysis) => analysis.vehicleId)
    .filter((vehicleId): vehicleId is string => Boolean(vehicleId));

  const [vehicles, watchlistItems] = await Promise.all([
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
        fuelType: true,
        transmission: true,
        powerHp: true,
        priceGross: true,
        country: true
      }
    }),
    prisma.watchlist.findMany({
      where: {
        companyId,
        vehicleId: {
          in: vehicleIds
        }
      },
      select: {
        id: true,
        vehicleId: true,
        stage: true,
        priority: true,
        nextActionAt: true
      }
    })
  ]);

  const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const watchlistMap = new Map(watchlistItems.map((item) => [item.vehicleId, item]));

  return analyses
    .map((analysis) => ({
      ...analysis,
      estimatedTransactionPrice: analysis.estimatedTransactionPrice ? Number(analysis.estimatedTransactionPrice) : null,
      projectedMargin: analysis.projectedMargin ? Number(analysis.projectedMargin) : null,
      purchasePrice: Number(analysis.purchasePrice),
      totalLandedCost: analysis.totalLandedCost ? Number(analysis.totalLandedCost) : null,
      vehicle: analysis.vehicleId ? vehicleMap.get(analysis.vehicleId) ?? null : null,
      watchlistItem: analysis.vehicleId ? watchlistMap.get(analysis.vehicleId) ?? null : null
    }))
    .filter(
      (
        analysis
      ): analysis is typeof analysis & {
        vehicle: NonNullable<typeof analysis.vehicle>;
      } => analysis.vehicle !== null
    )
    .map((analysis) => ({
      ...analysis,
      vehicle: {
        ...analysis.vehicle,
        priceGross: analysis.vehicle.priceGross ? Number(analysis.vehicle.priceGross) : null
      }
    }));
}
