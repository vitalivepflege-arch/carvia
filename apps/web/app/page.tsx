import { AppShell } from "../components/shell/app-shell";
import { requireOnboardedSession } from "../lib/auth";
import { getDashboardMetrics } from "../lib/dashboard";

export default async function HomePage() {
  const session = await requireOnboardedSession();
  const metrics = await getDashboardMetrics(session.user.companyId!);

  return (
    <AppShell
      activeSection="Dashboard"
      alertSummary={metrics.alertSummary}
      analysesCount={metrics.analysesCount}
      companyName={metrics.company?.name ?? "Unknown Company"}
      openTaskCount={metrics.openTaskCount}
      pipelineSummary={metrics.pipelineSummary}
      providerCount={metrics.providerCount}
      recentAnalyses={metrics.recentAnalyses}
      watchlistCount={metrics.watchlistCount}
    />
  );
}
