import { prisma } from "@carvia/database";
import { providerCatalog } from "./providers";

const providerNameByKey = new Map<string, string>(
  providerCatalog.map((provider) => [provider.providerKey, provider.displayName])
);

export async function getProviderSyncWorkspace(companyId: string) {
  const [credentials, recentRuns] = await Promise.all([
    prisma.providerCredential.findMany({
      where: { companyId },
      orderBy: [{ nextSyncAt: "asc" }, { providerKey: "asc" }]
    }),
    prisma.providerSyncRun.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      take: 24
    })
  ]);

  const dueRuns = credentials.filter(
    (credential) =>
      credential.status === "CONNECTED" &&
      credential.syncMode === "SCHEDULED" &&
      credential.nextSyncAt &&
      credential.nextSyncAt <= new Date()
  );

  const failedRuns = recentRuns.filter((run) => run.status === "ERROR" || run.status === "RESET");
  const successfulRuns = recentRuns.filter((run) => run.status === "SUCCESS");

  return {
    dueRuns: dueRuns.map((credential) => ({
      cadenceHours: credential.cadenceHours,
      nextSyncAt: credential.nextSyncAt,
      providerKey: credential.providerKey,
      providerName: providerNameByKey.get(credential.providerKey) ?? credential.providerKey,
      status: credential.status
    })),
    recentFailures: failedRuns.map((run) => ({
      ...run,
      providerName: providerNameByKey.get(run.providerKey) ?? run.providerKey
    })),
    recentSuccesses: successfulRuns.map((run) => ({
      ...run,
      providerName: providerNameByKey.get(run.providerKey) ?? run.providerKey
    })),
    summary: {
      dueCount: dueRuns.length,
      failureCount: failedRuns.length,
      scheduledCount: credentials.filter((credential) => credential.syncMode === "SCHEDULED").length,
      staleCount: credentials.filter(
        (credential) =>
          credential.status === "CONNECTED" &&
          credential.lastSyncAt &&
          credential.lastSyncAt.getTime() < Date.now() - 48 * 60 * 60 * 1000
      ).length
    }
  };
}
