import Link from "next/link";
import { Card, StatusPill } from "@carvia/ui";
import { requireOnboardedSession } from "../../lib/auth";
import { getManagementWorkspace } from "../../lib/management";

export default async function ManagementPage() {
  const session = await requireOnboardedSession();
  const workspace = await getManagementWorkspace(session.user.companyId!);
  const marginDelta = workspace.monthComparison.currentMonthMargin - workspace.monthComparison.previousMonthMargin;
  const salesDelta = workspace.monthComparison.currentMonthSales - workspace.monthComparison.previousMonthSales;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f5f2e9_0%,#e5ebe8_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Management</p>
            <h1 className="mt-2 text-4xl font-semibold text-[var(--navy)]">Executive performance view</h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--foreground-muted)]">
              Track company-wide conversion, margin output, monthly sales movement, and stock health from one management layer.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/reports"
              className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--navy)]"
            >
              Open reports
            </Link>
            <Link
              href="/inventory"
              className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10"
            >
              Open inventory
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Win Rate", value: `${workspace.overview.winRate}%`, delta: "Won vs lost sales outcomes" },
            { label: "Won Deals", value: String(workspace.overview.wonDeals), delta: "Closed customer sales" },
            { label: "Active Sales", value: String(workspace.overview.activeSales), delta: "Live customer pipeline" },
            { label: "Avg Days To Sell", value: workspace.overview.avgDaysToSell.toLocaleString("en-US", { maximumFractionDigits: 0 }), delta: "Average sold-unit holding period" },
            { label: "Overdue Stock", value: String(workspace.overview.overdueStock), delta: "Units beyond target stock days" }
          ].map((metric) => (
            <Card key={metric.label} title={metric.label}>
              <p className="mt-4 text-3xl font-semibold text-[var(--navy)]">{metric.value}</p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">{metric.delta}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card title="Month Comparison">
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {[
                ["This Month Sales", `EUR ${workspace.monthComparison.currentMonthSales.toLocaleString("en-US", { maximumFractionDigits: 0 })}`],
                ["Last Month Sales", `EUR ${workspace.monthComparison.previousMonthSales.toLocaleString("en-US", { maximumFractionDigits: 0 })}`],
                ["This Month Margin", `EUR ${workspace.monthComparison.currentMonthMargin.toLocaleString("en-US", { maximumFractionDigits: 0 })}`],
                ["Last Month Margin", `EUR ${workspace.monthComparison.previousMonthMargin.toLocaleString("en-US", { maximumFractionDigits: 0 })}`]
              ].map(([label, value]) => (
                <div key={label} className="rounded-3xl bg-[var(--surface-muted)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">{label}</p>
                  <p className="mt-2 text-xl font-semibold text-[var(--navy)]">{value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-3">
              <StatusPill tone={marginDelta >= 0 ? "success" : "danger"}>
                Margin delta EUR {marginDelta.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </StatusPill>
              <StatusPill tone={salesDelta >= 0 ? "success" : "danger"}>
                Sales delta EUR {salesDelta.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </StatusPill>
            </div>
          </Card>

          <Card title="Conversion Health">
            <div className="mt-5 grid gap-4">
              {[
                ["Tracked to Offer", workspace.conversions.fromTrackedToOffer],
                ["Live to Lead", workspace.conversions.fromLiveToLead],
                ["Lead to Won", workspace.conversions.fromLeadToWon]
              ].map(([label, value]) => (
                <div key={label} className="rounded-3xl bg-[var(--surface-muted)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-[var(--navy)]">{label}</p>
                    <p className="text-sm text-[var(--foreground-muted)]">{value}%</p>
                  </div>
                  <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                    <div className="h-full rounded-full bg-[var(--navy)]" style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
              <div className="rounded-3xl border border-[var(--border)] bg-white p-4">
                <p className="text-sm text-[var(--foreground-muted)]">
                  Below-margin sold units against target:{" "}
                  <span className="font-semibold text-[var(--navy)]">{workspace.overview.belowMarginCount}</span>
                </p>
              </div>
            </div>
          </Card>
        </div>

        <Card title="Monthly Trend">
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {workspace.monthlyTrend.map((month) => (
              <div key={month.label} className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">{month.label}</p>
                <p className="mt-3 text-2xl font-semibold text-[var(--navy)]">{month.sales} sold</p>
                <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                  Revenue EUR {month.soldRevenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </p>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  Margin EUR {month.margin.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </p>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  New tracked units {month.purchases}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
