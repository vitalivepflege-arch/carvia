import { prisma } from "@carvia/database";
import { MockVehicleProvider } from "@carvia/providers";

const mockVehicleProvider = new MockVehicleProvider();

export const providerCatalog = [
  {
    providerKey: "mock",
    displayName: "Mock Vehicle Feed",
    type: "Development"
  },
  {
    providerKey: "mobile-de",
    displayName: "mobile.de Adapter",
    type: "Marketplace"
  },
  {
    providerKey: "autoscout24",
    displayName: "AutoScout24 Adapter",
    type: "Marketplace"
  },
  {
    providerKey: "google-routes",
    displayName: "Google Routes Distance",
    type: "Routing"
  }
] as const;

export type ProviderCatalogEntry = (typeof providerCatalog)[number];

export async function getProviderOverview(companyId: string) {
  const [credentials, mockHealth, syncRuns] = await Promise.all([
    prisma.providerCredential.findMany({
      where: { companyId },
      orderBy: { providerKey: "asc" }
    }),
    mockVehicleProvider.healthCheck(),
    prisma.providerSyncRun.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 20
    })
  ]);

  const credentialsByKey = new Map(credentials.map((credential) => [credential.providerKey, credential]));
  const syncRunsByProvider = new Map<string, typeof syncRuns>();

  for (const run of syncRuns) {
    const existing = syncRunsByProvider.get(run.providerKey) ?? [];
    existing.push(run);
    syncRunsByProvider.set(run.providerKey, existing);
  }

  return providerCatalog.map((provider) => {
    const credential = credentialsByKey.get(provider.providerKey);
    const providerRuns = syncRunsByProvider.get(provider.providerKey) ?? [];

    if (provider.providerKey === "mock") {
      return {
        credentialsHint: mockHealth.message ?? "Mock inventory is available.",
        displayName: provider.displayName,
        lastSyncAt: mockHealth.lastSyncAt ?? null,
        recentRuns: providerRuns,
        providerKey: provider.providerKey,
        status: mockHealth.status,
        type: provider.type
      };
    }

      return {
        credentialsHint:
          credential?.credentialsHint ??
          "Credentials not configured yet. Adapter stays disabled until explicit approval and official access exist.",
        displayName: provider.displayName,
        lastSyncAt: credential?.lastSyncAt ?? null,
        recentRuns: providerRuns,
        providerKey: provider.providerKey,
        status: credential?.status ?? "NOT_CONFIGURED",
        type: provider.type
      };
  });
}
