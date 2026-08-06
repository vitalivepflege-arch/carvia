import Link from "next/link";
import { Card, StatusPill } from "@carvia/ui";
import { requireOnboardedSession } from "../../lib/auth";
import { getAlertCenter } from "../../lib/alerts";

const severityTone = {
  info: "info",
  success: "success",
  warning: "warning"
} as const;

const priorityTone = {
  HIGH: "danger",
  LOW: "info",
  MEDIUM: "warning"
} as const;

function formatStage(stage: string) {
  return stage
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function AlertsPage() {
  const session = await requireOnboardedSession();
  const alertCenter = await getAlertCenter(session.user.companyId!);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#faf8f3_0%,#eff0eb_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Alerts</p>
          <h1 className="mt-2 text-4xl font-semibold text-[var(--navy)]">Daily review signals</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--foreground-muted)]">
            In-app alerts combine due pipeline actions, saved search changes, and buy-ready opportunities so the team can review Thursday, August 6, 2026 from one place.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Actionable", value: String(alertCenter.summary.actionableCount), delta: "Signals requiring attention" },
            { label: "Due Today", value: String(alertCenter.summary.dueTodayCount), delta: "Watchlist follow-ups due on August 6, 2026" },
            { label: "Search Signals", value: String(alertCenter.summary.searchSignalCount), delta: "Saved searches with more matches" },
            { label: "Ready Signals", value: String(alertCenter.summary.readyToBuyCount), delta: "Negotiating or ready-to-buy cases" }
          ].map((item) => (
            <Card key={item.label} title={item.label}>
              <p className="mt-4 text-3xl font-semibold text-[var(--navy)]">{item.value}</p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">{item.delta}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card title="Saved Search Signals">
            <div className="mt-5 space-y-4">
              {alertCenter.searchAlerts.length === 0 ? (
                <div className="rounded-3xl bg-[var(--surface-muted)] p-5">
                  <p className="font-medium text-[var(--navy)]">No alert-enabled searches yet</p>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                    Enable alerts on saved searches in Market Search to generate sourcing signals here.
                  </p>
                </div>
              ) : (
                alertCenter.searchAlerts.map((alert) => (
                  <div key={alert.id} className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[var(--navy)]">{alert.name}</p>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                          {[alert.filters.make || "Any make", alert.filters.model || "Any model", alert.filters.fuelType || "Any fuel"].join(" | ")}
                        </p>
                      </div>
                      <StatusPill tone={severityTone[alert.severity]}>
                        {alert.delta > 0 ? `+${alert.delta} new matches` : `${alert.currentResultCount} matches`}
                      </StatusPill>
                    </div>

                    <p className="mt-3 text-sm text-[var(--foreground-muted)]">
                      Previous baseline {alert.lastRunResultCount} | Current result count {alert.currentResultCount}
                    </p>

                    <Link
                      href={`/market-search?make=${encodeURIComponent(alert.filters.make)}&model=${encodeURIComponent(alert.filters.model)}&fuelType=${encodeURIComponent(alert.filters.fuelType)}&transmission=${encodeURIComponent(alert.filters.transmission)}&purchasePriceMax=${encodeURIComponent(alert.filters.purchasePriceMax)}`}
                      className="mt-4 inline-flex rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)]"
                    >
                      Open search
                    </Link>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card title="Due Pipeline Actions">
            <div className="mt-5 space-y-4">
              {alertCenter.duePipelineAlerts.length === 0 ? (
                <div className="rounded-3xl bg-[var(--surface-muted)] p-5">
                  <p className="font-medium text-[var(--navy)]">No due actions today</p>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                    Set next action dates on watchlist items to turn the acquisition workflow into a scheduled review loop.
                  </p>
                </div>
              ) : (
                alertCenter.duePipelineAlerts.map((alert) => (
                  <div key={alert.id} className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[var(--navy)]">
                          {alert.vehicle ? `${alert.vehicle.make} ${alert.vehicle.model}` : "Tracked vehicle"}
                        </p>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                          {alert.nextActionAt?.toLocaleDateString("en-US", { dateStyle: "long" }) ?? "No date"} | {formatStage(alert.stage)}
                        </p>
                      </div>
                      <StatusPill tone={priorityTone[alert.priority]}>{alert.priority} priority</StatusPill>
                    </div>

                    <p className="mt-3 text-sm text-[var(--foreground)]">
                      {alert.note ?? "No internal note stored for this watchlist item yet."}
                    </p>

                    <Link
                      href="/watchlist"
                      className="mt-4 inline-flex rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)]"
                    >
                      Open watchlist
                    </Link>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <Card title="Ready Signals">
          <div className="mt-5 space-y-4">
            {alertCenter.readyToBuyAlerts.length === 0 ? (
              <div className="rounded-3xl bg-[var(--surface-muted)] p-5">
                <p className="font-medium text-[var(--navy)]">No negotiating or buy-ready items</p>
                <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                  Move watchlist items into `Negotiating` or `Ready to buy` to surface execution candidates here.
                </p>
              </div>
            ) : (
              alertCenter.readyToBuyAlerts.map((alert) => (
                <div key={alert.id} className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--navy)]">
                        {alert.vehicle ? `${alert.vehicle.make} ${alert.vehicle.model}` : "Tracked vehicle"}
                      </p>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">{formatStage(alert.stage)}</p>
                    </div>
                    <StatusPill tone={priorityTone[alert.priority]}>{alert.priority} priority</StatusPill>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
