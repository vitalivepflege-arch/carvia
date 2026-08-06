import Link from "next/link";
import { Card, StatusPill } from "@carvia/ui";
import { requireOnboardedSession } from "../../lib/auth";
import { getClosingWorkspace, closingStatusLabels } from "../../lib/closings";
import { offerStatusLabels } from "../../lib/offers";

const closingTone = {
  CANCELLED: "danger",
  COMPLETED: "success",
  NONE: "info",
  PAPERWORK_PENDING: "warning",
  PAYMENT_PENDING: "warning",
  TRANSPORT_BOOKED: "info"
} as const;

const offerTone = {
  ACCEPTED: "success",
  COUNTER_RECEIVED: "warning",
  NONE: "info",
  OFFER_SENT: "warning",
  PREPARING: "info",
  REJECTED: "danger"
} as const;

export default async function ClosingsPage() {
  const session = await requireOnboardedSession();
  const items = await getClosingWorkspace(session.user.companyId!);
  const activeClosings = items.filter((item) =>
    item.closingStatus === "PAPERWORK_PENDING" ||
    item.closingStatus === "PAYMENT_PENDING" ||
    item.closingStatus === "TRANSPORT_BOOKED"
  ).length;
  const completedClosings = items.filter((item) => item.closingStatus === "COMPLETED").length;
  const acceptedDeals = items.filter((item) => item.offerStatus === "ACCEPTED").length;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#faf8f3_0%,#eff0eb_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Closings</p>
            <h1 className="mt-2 text-4xl font-semibold text-[var(--navy)]">Purchase execution workspace</h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--foreground-muted)]">
              Move accepted negotiations through paperwork, payment, transport, and final handoff so the buying team can execute deals cleanly after agreement.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/offers"
              className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--navy)]"
            >
              Open offers
            </Link>
            <Link
              href="/watchlist"
              className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10"
            >
              Manage watchlist
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Accepted Deals", value: String(acceptedDeals), delta: "Negotiations won" },
            { label: "Active Closings", value: String(activeClosings), delta: "In paperwork, payment, or transport" },
            { label: "Completed", value: String(completedClosings), delta: "Closed purchase workflows" },
            { label: "Tracked Deals", value: String(items.length), delta: "Watchlist opportunities overall" }
          ].map((metric) => (
            <Card key={metric.label} title={metric.label}>
              <p className="mt-4 text-3xl font-semibold text-[var(--navy)]">{metric.value}</p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">{metric.delta}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-5">
          {items.length === 0 ? (
            <Card title="No closings tracked">
              <p className="mt-5 text-sm text-[var(--foreground-muted)]">
                Add opportunities to the watchlist and move them into active offers before using the closing workspace.
              </p>
            </Card>
          ) : (
            items.map((item) => (
              <Card key={item.id} title={`${item.vehicle.make} ${item.vehicle.model}`}>
                <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusPill tone={offerTone[item.offerStatus]}>{offerStatusLabels[item.offerStatus]}</StatusPill>
                      <StatusPill tone={closingTone[item.closingStatus]}>{closingStatusLabels[item.closingStatus]}</StatusPill>
                      <StatusPill tone="info">{item.vehicle.country ?? "EU stock"}</StatusPill>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        ["Accepted / Last Offer", item.latestOfferPrice ? `EUR ${item.latestOfferPrice.toLocaleString("en-US")}` : "-"],
                        ["Target Buy", item.targetBuyPrice ? `EUR ${item.targetBuyPrice.toLocaleString("en-US")}` : "-"],
                        ["Closing Target", item.closingTargetDate ? item.closingTargetDate.toLocaleDateString("en-US", { dateStyle: "medium" }) : "-"],
                        ["Projected Margin", item.analysis?.projectedMargin ? `EUR ${item.analysis.projectedMargin.toLocaleString("en-US")}` : "-"]
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-3xl bg-[var(--surface-muted)] p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">{label}</p>
                          <p className="mt-2 text-base font-medium text-[var(--navy)]">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 rounded-3xl bg-[var(--surface-muted)] p-4">
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        ["Paperwork", item.paperworkCompletedAt ? item.paperworkCompletedAt.toLocaleDateString("en-US", { dateStyle: "medium" }) : "Open"],
                        ["Payment", item.paymentCompletedAt ? item.paymentCompletedAt.toLocaleDateString("en-US", { dateStyle: "medium" }) : "Open"],
                        ["Handoff", item.handoffCompletedAt ? item.handoffCompletedAt.toLocaleDateString("en-US", { dateStyle: "medium" }) : "Open"]
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
                        Update closing
                      </Link>
                      <Link
                        href="/offers"
                        className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)]"
                      >
                        Open offers
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
