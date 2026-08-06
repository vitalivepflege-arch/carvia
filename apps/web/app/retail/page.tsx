import Link from "next/link";
import { Card, StatusPill } from "@carvia/ui";
import { requireOnboardedSession } from "../../lib/auth";
import { getRetailWorkspace, retailStatusLabels } from "../../lib/retail";
import { closingStatusLabels } from "../../lib/closings";

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

export default async function RetailPage() {
  const session = await requireOnboardedSession();
  const items = await getRetailWorkspace(session.user.companyId!);
  const activeRetail = items.filter(
    (item) =>
      item.retailStatus === "RECONDITIONING" ||
      item.retailStatus === "MEDIA_PENDING" ||
      item.retailStatus === "LISTING_READY" ||
      item.retailStatus === "LIVE"
  ).length;
  const liveListings = items.filter((item) => item.retailStatus === "LIVE").length;
  const soldUnits = items.filter((item) => item.retailStatus === "SOLD").length;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f4ed_0%,#e9ece8_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Retail</p>
            <h1 className="mt-2 text-4xl font-semibold text-[var(--navy)]">Exit and resale workspace</h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--foreground-muted)]">
              Guide purchased vehicles through reconditioning, media, listing readiness, go-live, and sold state so the team can track the exit path end to end.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/closings"
              className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--navy)]"
            >
              Open closings
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
            { label: "Active Retail", value: String(activeRetail), delta: "Prep, media, ready, or live" },
            { label: "Live Listings", value: String(liveListings), delta: "Currently in market" },
            { label: "Sold Units", value: String(soldUnits), delta: "Exited inventory" },
            { label: "Tracked Deals", value: String(items.length), delta: "All watchlist opportunities" }
          ].map((metric) => (
            <Card key={metric.label} title={metric.label}>
              <p className="mt-4 text-3xl font-semibold text-[var(--navy)]">{metric.value}</p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">{metric.delta}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-5">
          {items.length === 0 ? (
            <Card title="No retail flow tracked">
              <p className="mt-5 text-sm text-[var(--foreground-muted)]">
                Move a vehicle through closing first, then use the watchlist workflow to start reconditioning and listing preparation.
              </p>
            </Card>
          ) : (
            items.map((item) => (
              <Card key={item.id} title={`${item.vehicle.make} ${item.vehicle.model}`}>
                <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusPill tone={closingTone[item.closingStatus]}>{closingStatusLabels[item.closingStatus]}</StatusPill>
                      <StatusPill tone={retailTone[item.retailStatus]}>{retailStatusLabels[item.retailStatus]}</StatusPill>
                      <StatusPill tone="info">{item.vehicle.country ?? "EU stock"}</StatusPill>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        ["Buy In", item.latestOfferPrice ? `EUR ${item.latestOfferPrice.toLocaleString("en-US")}` : "-"],
                        ["Retail Ask", item.retailAskingPrice ? `EUR ${item.retailAskingPrice.toLocaleString("en-US")}` : "-"],
                        ["Target Live Date", item.retailTargetDate ? item.retailTargetDate.toLocaleDateString("en-US", { dateStyle: "medium" }) : "-"],
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
                    <div className="grid gap-3 sm:grid-cols-4">
                      {[
                        ["Recon", item.reconditioningCompletedAt ? item.reconditioningCompletedAt.toLocaleDateString("en-US", { dateStyle: "medium" }) : "Open"],
                        ["Media", item.mediaCompletedAt ? item.mediaCompletedAt.toLocaleDateString("en-US", { dateStyle: "medium" }) : "Open"],
                        ["Listing", item.listingPublishedAt ? item.listingPublishedAt.toLocaleDateString("en-US", { dateStyle: "medium" }) : "Open"],
                        ["Sold", item.soldAt ? item.soldAt.toLocaleDateString("en-US", { dateStyle: "medium" }) : "Open"]
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
                        Update retail flow
                      </Link>
                      <Link
                        href="/closings"
                        className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)]"
                      >
                        Open closings
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
