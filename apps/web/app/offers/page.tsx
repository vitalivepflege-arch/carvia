import Link from "next/link";
import { Card, StatusPill } from "@carvia/ui";
import { requireOnboardedSession } from "../../lib/auth";
import { offerStatusLabels, getOfferWorkspace } from "../../lib/offers";

const priorityTone = {
  HIGH: "danger",
  LOW: "info",
  MEDIUM: "warning"
} as const;

const offerTone = {
  ACCEPTED: "success",
  COUNTER_RECEIVED: "warning",
  NONE: "info",
  OFFER_SENT: "warning",
  PREPARING: "info",
  REJECTED: "danger"
} as const;

export default async function OffersPage() {
  const session = await requireOnboardedSession();
  const items = await getOfferWorkspace(session.user.companyId!);
  const activeCount = items.filter((item) => item.offerStatus === "OFFER_SENT" || item.offerStatus === "COUNTER_RECEIVED").length;
  const acceptedCount = items.filter((item) => item.offerStatus === "ACCEPTED").length;
  const preparingCount = items.filter((item) => item.offerStatus === "PREPARING").length;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#faf8f3_0%,#eff0eb_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Offers</p>
            <h1 className="mt-2 text-4xl font-semibold text-[var(--navy)]">Negotiation workspace</h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--foreground-muted)]">
              Track target buy price, live offers, counters, and negotiation outcomes so buy-side execution is visible across the team.
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
              href="/watchlist"
              className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10"
            >
              Manage watchlist
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Tracked Deals", value: String(items.length), delta: "Watchlist opportunities" },
            { label: "Active Negotiations", value: String(activeCount), delta: "Offer sent or counter received" },
            { label: "Preparing", value: String(preparingCount), delta: "Target price set but not sent" },
            { label: "Accepted", value: String(acceptedCount), delta: "Deals ready to close" }
          ].map((metric) => (
            <Card key={metric.label} title={metric.label}>
              <p className="mt-4 text-3xl font-semibold text-[var(--navy)]">{metric.value}</p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">{metric.delta}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-5">
          {items.length === 0 ? (
            <Card title="No tracked deals">
              <p className="mt-5 text-sm text-[var(--foreground-muted)]">
                Add vehicles into the watchlist first, then use the offer controls there to build a negotiation pipeline.
              </p>
            </Card>
          ) : (
            items.map((item) => (
              <Card key={item.id} title={`${item.vehicle.make} ${item.vehicle.model}`}>
                <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusPill tone={priorityTone[item.priority]}>{item.priority}</StatusPill>
                      <StatusPill tone={offerTone[item.offerStatus]}>{offerStatusLabels[item.offerStatus]}</StatusPill>
                      <StatusPill tone="info">{item.vehicle.country ?? "EU stock"}</StatusPill>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        ["Ask", item.vehicle.priceGross ? `EUR ${item.vehicle.priceGross.toLocaleString("en-US")}` : "-"],
                        ["Target Buy", item.targetBuyPrice ? `EUR ${item.targetBuyPrice.toLocaleString("en-US")}` : "-"],
                        ["Last Offer", item.latestOfferPrice ? `EUR ${item.latestOfferPrice.toLocaleString("en-US")}` : "-"],
                        ["Counter", item.counterOfferPrice ? `EUR ${item.counterOfferPrice.toLocaleString("en-US")}` : "-"]
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-3xl bg-[var(--surface-muted)] p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">{label}</p>
                          <p className="mt-2 text-base font-medium text-[var(--navy)]">{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-4 rounded-3xl bg-[var(--surface-muted)] p-4">
                    <p className="text-sm text-[var(--foreground-muted)]">
                      {item.offerUpdatedAt
                        ? `Offer state updated on ${item.offerUpdatedAt.toLocaleDateString("en-US", { dateStyle: "long" })}.`
                        : "No offer updates logged yet."}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href="/watchlist"
                        className="rounded-full bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white"
                      >
                        Edit offer
                      </Link>
                      {item.analysis ? (
                        <Link
                          href={`/analyses/${item.analysis.id}`}
                          className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)]"
                        >
                          Open analysis
                        </Link>
                      ) : null}
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
