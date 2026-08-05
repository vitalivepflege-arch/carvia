import { prisma } from "@carvia/database";

export async function getDashboardMetrics(companyId: string) {
  const [watchlistCount, analysesCount, providerCount, company] = await Promise.all([
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
    })
  ]);

  return {
    watchlistCount,
    analysesCount,
    providerCount,
    company
  };
}

