import Link from "next/link";
import { Card, StatusPill } from "@carvia/ui";
import { shellSections } from "../../lib/nav";
import { SignOutButton } from "./sign-out-button";

export function AppShell({
  activeSection = "Dashboard",
  analysesCount,
  companyName,
  providerCount,
  recentAnalyses,
  watchlistCount
}: {
  activeSection?: string;
  analysesCount: number;
  companyName: string;
  providerCount: number;
  recentAnalyses: Array<{
    confidence: number | null;
    dealerScore: number | null;
    id: string;
    projectedMargin: number | string | null;
    vehicle: {
      firstRegistration: Date | null;
      id: string;
      make: string;
      mileageKm: number | null;
      model: string;
      powerHp: number | null;
    } | null;
  }>;
  watchlistCount: number;
}) {
  return (
    <main className="min-h-screen px-6 py-8 md:px-10">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[32px] border border-[var(--border)] bg-[rgba(17,37,59,0.96)] p-6 text-white shadow-2xl shadow-slate-900/15">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.32em] text-teal-200">Carvia Intelligence</p>
            <h1 className="text-3xl font-semibold">Buy smarter. Sell faster.</h1>
            <p className="text-sm text-slate-300">
              A premium automotive command layer for dealer sourcing, pricing confidence, and margin-aware decisions.
            </p>
          </div>

          <div className="mt-5">
            <SignOutButton />
          </div>

          <nav className="mt-8 space-y-3">
            {shellSections.map((section) => (
              <Link
                key={section.label}
                href={section.href}
                className={`rounded-2xl border px-4 py-3 ${
                  section.label === activeSection
                    ? "border-teal-300/60 bg-teal-400/10 text-white"
                    : "border-white/10 bg-white/5 text-slate-200"
                }`}
              >
                <p className="text-sm font-medium">{section.label}</p>
                <p className="mt-1 text-xs text-slate-400">{section.value}</p>
              </Link>
            ))}
          </nav>

          <div className="mt-10 rounded-3xl border border-white/10 bg-white/5 p-4">
            <StatusPill tone="info">Mock Data Active</StatusPill>
            <p className="mt-3 text-sm text-slate-300">
              Provider adapters are scaffolded, but live sources stay disabled until official credentials are configured.
            </p>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Company", value: companyName, delta: "Current tenant context" },
              { label: "Analyses", value: String(analysesCount), delta: "Scoped to your company" },
              { label: "Watchlist", value: String(watchlistCount), delta: "Saved opportunities" },
              { label: "Providers", value: String(providerCount), delta: "Connected or staged adapters" }
            ].map((kpi) => (
              <Card key={kpi.label} title={kpi.label}>
                <p className="mt-4 text-3xl font-semibold text-[var(--navy)]">{kpi.value}</p>
                <p className="mt-2 text-sm text-[var(--foreground-muted)]">{kpi.delta}</p>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)]">
            <Card title="Current MVP Footing">
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl bg-[var(--surface-muted)] p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Live foundations</p>
                  <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
                    <li>Tenant-safe authentication and onboarding</li>
                    <li>Deal Check workflow with persisted analyses</li>
                    <li>Watchlist flow for tracked opportunities</li>
                    <li>Provider boundaries and mock market inventory</li>
                  </ul>
                </div>
                <div className="rounded-3xl bg-[var(--surface-muted)] p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Next implementation focus</p>
                  <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
                    <li>Saved searches and sourcing alerts</li>
                    <li>Provider credential management</li>
                    <li>Import and normalization pipeline</li>
                    <li>Deeper scoring and risk explainability</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card title="Recent Analyses">
              <div className="mt-5 space-y-4">
                {recentAnalyses.length === 0 ? (
                  <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-5">
                    <p className="font-medium text-[var(--navy)]">No saved analyses yet</p>
                    <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                      Run the first Deal Check to populate the dashboard with company-specific opportunities.
                    </p>
                  </div>
                ) : (
                  recentAnalyses.map((analysis) => (
                  <Link
                    href={`/analyses/${analysis.id}`}
                    key={analysis.id}
                    className="block rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-[var(--navy)]">
                          {analysis.vehicle
                            ? `${analysis.vehicle.make} ${analysis.vehicle.model}`
                            : "Saved vehicle"}
                        </p>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                          Projected Margin EUR {Number(analysis.projectedMargin ?? 0).toLocaleString("en-US")}
                        </p>
                      </div>
                      <StatusPill tone="success">Score {analysis.dealerScore ?? "-"}</StatusPill>
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
                      Confidence {analysis.confidence ?? "-"}%
                    </p>
                  </Link>
                  ))
                )}
              </div>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
