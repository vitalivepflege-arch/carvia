import { prisma } from "@carvia/database";
import { MockVehicleProvider } from "@carvia/providers";

const mockVehicleProvider = new MockVehicleProvider();

const providerCatalog = [
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

export async function getProviderOverview(companyId: string) {
  const [credentials, mockHealth] = await Promise.all([
    prisma.providerCredential.findMany({
      where: { companyId },
      orderBy: { providerKey: "asc" }
    }),
    mockVehicleProvider.healthCheck()
  ]);

  const credentialsByKey = new Map(credentials.map((credential) => [credential.providerKey, credential]));

  return providerCatalog.map((provider) => {
    const credential = credentialsByKey.get(provider.providerKey);

    if (provider.providerKey === "mock") {
      return {
        credentialsHint: mockHealth.message ?? "Mock inventory is available.",
        displayName: provider.displayName,
        lastSyncAt: mockHealth.lastSyncAt ?? null,
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
      providerKey: provider.providerKey,
      status: credential?.status ?? "NOT_CONFIGURED",
      type: provider.type
    };
  });
}
