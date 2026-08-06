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
        cadenceHours: null,
        lastSyncAt: mockHealth.lastSyncAt ?? null,
        nextSyncAt: null,
        recentRuns: providerRuns,
        providerKey: provider.providerKey,
        status: mockHealth.status,
        syncMode: "MANUAL" as const,
        type: provider.type
      };
    }

      return {
        cadenceHours: credential?.cadenceHours ?? null,
        credentialsHint:
          credential?.credentialsHint ??
          "Credentials not configured yet. Adapter stays disabled until explicit approval and official access exist.",
        displayName: provider.displayName,
        lastErrorAt: credential?.lastErrorAt ?? null,
        lastErrorMessage: credential?.lastErrorMessage ?? null,
        lastSyncAt: credential?.lastSyncAt ?? null,
        nextSyncAt: credential?.nextSyncAt ?? null,
        recentRuns: providerRuns,
        providerKey: provider.providerKey,
        status: credential?.status ?? "NOT_CONFIGURED",
        syncMode: credential?.syncMode ?? "MANUAL",
        type: provider.type
      };
  });
}

export async function getProviderControlSummary(companyId: string) {
  const credentials = await prisma.providerCredential.findMany({
    where: { companyId },
    select: {
      lastErrorAt: true,
      providerKey: true,
      status: true,
      syncMode: true,
      nextSyncAt: true
    }
  });

  const dueSyncCount = credentials.filter(
    (credential) =>
      credential.status === "CONNECTED" &&
      credential.syncMode === "SCHEDULED" &&
      credential.nextSyncAt &&
      credential.nextSyncAt <= new Date()
  ).length;

  const scheduledCount = credentials.filter((credential) => credential.syncMode === "SCHEDULED").length;
  const connectedCount = credentials.filter((credential) => credential.status === "CONNECTED").length;
  const errorCount = credentials.filter(
    (credential) => credential.status === "ERROR" || credential.lastErrorAt !== null
  ).length;

  return {
    connectedCount,
    dueSyncCount,
    errorCount,
    scheduledCount
  };
}
