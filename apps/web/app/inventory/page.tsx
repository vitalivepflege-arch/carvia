import Link from "next/link";
import { Card, StatusPill } from "@carvia/ui";
import { requireOnboardedSession } from "../../lib/auth";
import { getInventoryWorkspace } from "../../lib/inventory";

export default async function InventoryPage() {
  const session = await requireOnboardedSession();
  const workspace = await getInventoryWorkspace(session.user.companyId!);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f4ec_0%,#e8ece8_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Inventory</p>
            <h1 className="mt-2 text-4xl font-semibold text-[var(--navy)]">Unit economics workspace</h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--foreground-muted)]">
              Track capital committed, extra costs, days in stock, and actual margin variance so every vehicle can be managed as an economic unit from buy-in to sale.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/sales"
              className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--navy)]"
            >
              Open sales
            </Link>
            <Link
              href="/watchlist"
              className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10"
            >
              Manage watchlist
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Capital At Risk", value: `EUR ${workspace.summary.capitalAtRisk.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, delta: "Unsold inventory invested" },
            { label: "Avg Days In Stock", value: workspace.summary.averageDaysInStock.toLocaleString("en-US", { maximumFractionDigits: 0 }), delta: "Mean unit holding period" },
            { label: "Extra Costs", value: `EUR ${workspace.summary.totalAdditionalCosts.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, delta: "Transport, recon, holding, misc" },
            { label: "Over Target Days", value: String(workspace.summary.overTargetDaysCount), delta: `Beyond target of ${workspace.company?.targetDaysToSell ?? "-"} days` },
            { label: "Margin Variance Risk", value: String(workspace.summary.unitsWithNegativeVariance), delta: "Actual below projected margin" }
          ].map((metric) => (
            <Card key={metric.label} title={metric.label}>
              <p className="mt-4 text-3xl font-semibold text-[var(--navy)]">{metric.value}</p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">{metric.delta}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-5">
          {workspace.items.length === 0 ? (
            <Card title="No inventory tracked">
              <p className="mt-5 text-sm text-[var(--foreground-muted)]">
                Add deals to the watchlist and update buy-in, retail, and sales data to unlock unit-economics tracking.
              </p>
            </Card>
          ) : (
            workspace.items.map((item) => (
              <Card key={item.id} title={`${item.vehicle.make} ${item.vehicle.model}`}>
                <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusPill tone={item.daysInStock > (workspace.company?.targetDaysToSell ?? Number.MAX_SAFE_INTEGER) ? "warning" : "info"}>
                        {item.daysInStock} days in stock
                      </StatusPill>
                      <StatusPill tone={item.actualMargin !== null && item.actualMargin < 0 ? "danger" : "success"}>
                        {item.actualMargin !== null ? `Margin EUR ${item.actualMargin.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "Margin open"}
                      </StatusPill>
                      <StatusPill tone="info">{item.vehicle.country ?? "EU stock"}</StatusPill>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {[
                        ["Buy In", `EUR ${item.buyIn.toLocaleString("en-US", { maximumFractionDigits: 0 })}`],
                        ["Total Investment", `EUR ${item.totalInvestment.toLocaleString("en-US", { maximumFractionDigits: 0 })}`],
                        ["Retail Ask", item.retailAsk !== null ? `EUR ${item.retailAsk.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "-"],
                        ["Sold Retail", item.soldRetailPrice !== null ? `EUR ${item.soldRetailPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "-"],
                        ["Projected Margin", item.analysis?.projectedMargin !== null && item.analysis?.projectedMargin !== undefined ? `EUR ${item.analysis.projectedMargin.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "-"],
                        ["Actual Margin", item.actualMargin !== null ? `EUR ${item.actualMargin.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "-"]
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-3xl bg-[var(--surface-muted)] p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">{label}</p>
                          <p className="mt-2 text-base font-medium text-[var(--navy)]">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 rounded-3xl bg-[var(--surface-muted)] p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {[
                        ["Transport", item.transportCost ? `EUR ${item.transportCost.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "-"],
                        ["Recon", item.reconditioningCost ? `EUR ${item.reconditioningCost.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "-"],
                        ["Holding", item.holdingCost ? `EUR ${item.holdingCost.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "-"],
                        ["Misc", item.miscCost ? `EUR ${item.miscCost.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "-"]
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-2xl border border-[var(--border)] bg-white p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">{label}</p>
                          <p className="mt-2 text-sm text-[var(--navy)]">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href="/watchlist"
                        className="rounded-full bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white"
                      >
                        Update economics
                      </Link>
                      <Link
                        href="/reports"
                        className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)]"
                      >
                        Open reports
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
