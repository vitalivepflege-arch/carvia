import { AppShell } from "../components/shell/app-shell";
import { requireOnboardedSession } from "../lib/auth";
import { getDashboardMetrics } from "../lib/dashboard";

export default async function HomePage() {
  const session = await requireOnboardedSession();
  const metrics = await getDashboardMetrics(session.user.companyId!);

  return (
    <AppShell
      analysesCount={metrics.analysesCount}
      companyName={metrics.company?.name ?? "Unknown Company"}
      providerCount={metrics.providerCount}
      watchlistCount={metrics.watchlistCount}
    />
  );
}
