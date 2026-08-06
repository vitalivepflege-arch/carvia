import { prisma } from "@carvia/database";
import { getAlertCenter } from "./alerts";
import { getOpenTaskCount } from "./tasks";
import { getWatchlistPipelineSummary } from "./watchlist";

export async function getDashboardMetrics(companyId: string) {
  const [watchlistCount, analysesCount, providerCount, company, recentAnalyses, pipelineSummary, alertCenter, openTaskCount] = await Promise.all([
    prisma.watchlist.count({ where: { companyId } }),
    prisma.vehicleAnalysis.count({ where: { companyId } }),
    prisma.providerCredential.count({ where: { companyId } }),
    prisma.company.findUnique({
      where: { id: companyId },
      select: {
        name: true,
        preferredBrands: true,
        minimumMarginTarget: true,
        targetDaysToSell: true
      }
    }),
    prisma.vehicleAnalysis.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        id: true,
        vehicleId: true,
        estimatedTransactionPrice: true,
        projectedMargin: true,
        dealerScore: true,
        confidence: true,
        createdAt: true
      }
    }),
    getWatchlistPipelineSummary(companyId),
    getAlertCenter(companyId),
    getOpenTaskCount(companyId)
  ]);

  const vehicles = recentAnalyses.length
    ? await prisma.vehicle.findMany({
        where: {
          id: {
            in: recentAnalyses
              .map((analysis) => analysis.vehicleId)
              .filter((vehicleId): vehicleId is string => Boolean(vehicleId))
          }
        },
        select: {
          id: true,
          make: true,
          model: true,
          firstRegistration: true,
          mileageKm: true,
          powerHp: true
        }
      })
    : [];

  const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));

  return {
    watchlistCount,
    pipelineSummary,
    openTaskCount,
    alertSummary: alertCenter.summary,
    analysesCount,
    providerCount,
    company,
    recentAnalyses: recentAnalyses.map((analysis) => ({
      ...analysis,
      projectedMargin: analysis.projectedMargin ? Number(analysis.projectedMargin) : null,
      vehicle: analysis.vehicleId ? vehicleMap.get(analysis.vehicleId) ?? null : null
    }))
  };
}
