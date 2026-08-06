import Link from "next/link";
import { Card, StatusPill } from "@carvia/ui";
import { requireOnboardedSession } from "../../lib/auth";
import { closingStatusLabels } from "../../lib/closings";
import { getReportingWorkspace } from "../../lib/reporting";
import { watchlistRetailStatusLabels } from "../../lib/watchlist";

const bottleneckTone = {
  danger: "danger",
  info: "info",
  warning: "warning"
} as const;

const retailTone = {
  LISTING_READY: "info",
  LIVE: "success",
  MEDIA_PENDING: "warning",
  NONE: "info",
  RECONDITIONING: "warning",
  SOLD: "success"
} as const;

const closingTone = {
  CANCELLED: "danger",
  COMPLETED: "success",
  NONE: "info",
  PAPERWORK_PENDING: "warning",
  PAYMENT_PENDING: "warning",
  TRANSPORT_BOOKED: "info"
} as const;

export default async function ReportsPage() {
  const session = await requireOnboardedSession();
  const workspace = await getReportingWorkspace(session.user.companyId!);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6f3eb_0%,#e6ebe8_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Reports</p>
            <h1 className="mt-2 text-4xl font-semibold text-[var(--navy)]">Funnel and operations reporting</h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--foreground-muted)]">
              See how sourcing opportunities move from review to negotiation, purchase execution, retail activation, and sold state with one operator view.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/pipeline"
              className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--navy)]"
            >
              Open pipeline
            </Link>
            <Link
              href="/retail"
              className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10"
            >
              Open retail
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Tracked", value: String(workspace.funnel.totalTracked), delta: "All current opportunities" },
            { label: "Active Offers", value: String(workspace.funnel.activeOffers), delta: "Negotiations in motion" },
            { label: "Active Closings", value: String(workspace.funnel.activeClosings), delta: "Purchase execution live" },
            { label: "Active Retail", value: String(workspace.funnel.activeRetail), delta: "Prep, ready, or live" },
            { label: "Sold Units", value: String(workspace.funnel.soldUnits), delta: "Exited inventory" }
          ].map((metric) => (
            <Card key={metric.label} title={metric.label}>
              <p className="mt-4 text-3xl font-semibold text-[var(--navy)]">{metric.value}</p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">{metric.delta}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card title="Funnel Flow">
            <div className="mt-5 grid gap-4 md:grid-cols-3 xl:grid-cols-4">
              {[
                ["Negotiating", workspace.funnel.negotiating],
                ["Ready To Buy", workspace.funnel.readyToBuy],
                ["Completed Closings", workspace.funnel.completedClosings],
                ["Live Listings", workspace.funnel.liveListings]
              ].map(([label, value]) => (
                <div key={label} className="rounded-3xl bg-[var(--surface-muted)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">{label}</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--navy)]">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              {workspace.stageDistribution.map((stage) => {
                const share = workspace.funnel.totalTracked
                  ? Math.round((stage.value / workspace.funnel.totalTracked) * 100)
                  : 0;

                return (
                  <div key={stage.label} className="rounded-3xl bg-[var(--surface-muted)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-[var(--navy)]">{stage.label}</p>
                      <p className="text-sm text-[var(--foreground-muted)]">
                        {stage.value} | {share}%
                      </p>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                      <div
                        className="h-full rounded-full bg-[var(--navy)]"
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card title="Finance Snapshot">
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                ["Avg Projected Margin", `EUR ${workspace.finance.averageProjectedMargin.toLocaleString("en-US", { maximumFractionDigits: 0 })}`],
                ["Potential Retail Value", `EUR ${workspace.finance.potentialRetailValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`],
                ["Live Retail Value", `EUR ${workspace.finance.liveRetailValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`],
                ["Below Margin Target", String(workspace.finance.targetMarginGapCount)]
              ].map(([label, value]) => (
                <div key={label} className="rounded-3xl bg-[var(--surface-muted)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">{label}</p>
                  <p className="mt-2 text-xl font-semibold text-[var(--navy)]">{value}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card title="Bottlenecks">
            <div className="mt-5 space-y-3">
              {workspace.bottlenecks.map((entry) => (
                <div key={entry.label} className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[var(--navy)]">{entry.label}</p>
                    <StatusPill tone={bottleneckTone[entry.tone]}>{entry.count}</StatusPill>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Upcoming Actions">
            <div className="mt-5 space-y-4">
              {workspace.upcomingActions.length === 0 ? (
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-5">
                  <p className="font-medium text-[var(--navy)]">No scheduled actions yet</p>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                    Use the watchlist workflow to set next action dates and bring operational workload into this view.
                  </p>
                </div>
              ) : (
                workspace.upcomingActions.map((item) => (
                  <div key={`${item.vehicle.id}-${item.stage}`} className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={closingTone[item.closingStatus]}>{closingStatusLabels[item.closingStatus]}</StatusPill>
                      <StatusPill tone={retailTone[item.retailStatus]}>{watchlistRetailStatusLabels[item.retailStatus]}</StatusPill>
                    </div>
                    <p className="mt-3 text-base font-semibold text-[var(--navy)]">
                      {item.vehicle.make} {item.vehicle.model}
                    </p>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                      {item.nextActionAt
                        ? item.nextActionAt.toLocaleDateString("en-US", { dateStyle: "long" })
                        : "No date"}{" "}
                      | {item.priority} priority | {item.stage.toLowerCase().replaceAll("_", " ")}
                    </p>
                    <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                      Projected margin {item.projectedMargin ? `EUR ${item.projectedMargin.toLocaleString("en-US")}` : "-"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
