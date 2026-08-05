import { Card, StatusPill } from "@carvia/ui";
import { shellSections } from "../../lib/nav";
import { SignOutButton } from "./sign-out-button";

const topDeals = [
  { vehicle: "BMW M340i xDrive", score: 91, margin: "EUR 4,800", confidence: "82%" },
  { vehicle: "Mercedes C300e AMG Line", score: 87, margin: "EUR 3,900", confidence: "75%" },
  { vehicle: "Audi S5 TDI Quattro", score: 85, margin: "EUR 5,100", confidence: "69%" }
];

export function AppShell({
  analysesCount,
  companyName,
  providerCount,
  watchlistCount
}: {
  analysesCount: number;
  companyName: string;
  providerCount: number;
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
            {shellSections.map((section, index) => (
              <div
                key={section.label}
                className={`rounded-2xl border px-4 py-3 ${
                  index === 1
                    ? "border-teal-300/60 bg-teal-400/10 text-white"
                    : "border-white/10 bg-white/5 text-slate-200"
                }`}
              >
                <p className="text-sm font-medium">{section.label}</p>
                <p className="mt-1 text-xs text-slate-400">{section.value}</p>
              </div>
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
            <Card title="Phase 0 Repository Baseline">
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl bg-[var(--surface-muted)] p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Prepared boundaries</p>
                  <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
                    <li>Canonical vehicle schema</li>
                    <li>Provider contracts and mock mode</li>
                    <li>Confidence-aware scoring foundation</li>
                    <li>Tenant-safe company model baseline</li>
                  </ul>
                </div>
                <div className="rounded-3xl bg-[var(--surface-muted)] p-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Next implementation focus</p>
                  <ul className="mt-3 space-y-2 text-sm text-[var(--foreground)]">
                    <li>Authentication and company onboarding</li>
                    <li>Deal Check vehicle entry workflow</li>
                    <li>Mock market comparables</li>
                    <li>Analysis engine services</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card title="Top Deals Today">
              <div className="mt-5 space-y-4">
                {topDeals.map((deal) => (
                  <div
                    key={deal.vehicle}
                    className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-[var(--navy)]">{deal.vehicle}</p>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                          Projected Margin {deal.margin}
                        </p>
                      </div>
                      <StatusPill tone="success">Score {deal.score}</StatusPill>
                    </div>
                    <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
                      Confidence {deal.confidence}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}
