import Link from "next/link";
import { Card, StatusPill } from "@carvia/ui";
import { requireOnboardedSession } from "../../lib/auth";
import { getSalesWorkspace, salesStatusLabels } from "../../lib/sales";
import { retailStatusLabels } from "../../lib/retail";

const salesTone = {
  LEAD_NEW: "info",
  LOST: "danger",
  NEGOTIATING: "warning",
  NONE: "info",
  RESERVATION_PENDING: "warning",
  TEST_DRIVE_SCHEDULED: "info",
  WON: "success"
} as const;

const retailTone = {
  LISTING_READY: "info",
  LIVE: "success",
  MEDIA_PENDING: "warning",
  NONE: "info",
  RECONDITIONING: "warning",
  SOLD: "success"
} as const;

export default async function SalesPage() {
  const session = await requireOnboardedSession();
  const items = await getSalesWorkspace(session.user.companyId!);
  const activeSales = items.filter(
    (item) =>
      item.salesStatus === "LEAD_NEW" ||
      item.salesStatus === "RESERVATION_PENDING" ||
      item.salesStatus === "TEST_DRIVE_SCHEDULED" ||
      item.salesStatus === "NEGOTIATING"
  ).length;
  const wonCount = items.filter((item) => item.salesStatus === "WON").length;
  const testDriveCount = items.filter((item) => item.salesStatus === "TEST_DRIVE_SCHEDULED").length;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f3eb_0%,#e8ece7_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Sales</p>
            <h1 className="mt-2 text-4xl font-semibold text-[var(--navy)]">Lead execution workspace</h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--foreground-muted)]">
              Move live listings through incoming leads, reservation pressure, test drives, and final customer close so retail execution stays visible after go-live.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/inventory"
              className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--navy)]"
            >
              Open inventory
            </Link>
            <Link
              href="/retail"
              className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--navy)]"
            >
              Open retail
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
            { label: "Active Sales", value: String(activeSales), delta: "Leads, reservations, test drives" },
            { label: "Test Drives", value: String(testDriveCount), delta: "Scheduled customer appointments" },
            { label: "Won", value: String(wonCount), delta: "Customer closings won" },
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
            <Card title="No sales flow tracked">
              <p className="mt-5 text-sm text-[var(--foreground-muted)]">
                Push vehicles live in retail first, then track lead activity and closing progress in the sales workspace.
              </p>
            </Card>
          ) : (
            items.map((item) => (
              <Card key={item.id} title={`${item.vehicle.make} ${item.vehicle.model}`}>
                <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusPill tone={retailTone[item.retailStatus]}>{retailStatusLabels[item.retailStatus]}</StatusPill>
                      <StatusPill tone={salesTone[item.salesStatus]}>{salesStatusLabels[item.salesStatus]}</StatusPill>
                      <StatusPill tone="info">{item.vehicle.country ?? "EU stock"}</StatusPill>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        ["Retail Ask", item.retailAskingPrice ? `EUR ${item.retailAskingPrice.toLocaleString("en-US")}` : "-"],
                        ["Lead Count", String(item.leadCount ?? 0)],
                        ["Sales Target", item.salesTargetDate ? item.salesTargetDate.toLocaleDateString("en-US", { dateStyle: "medium" }) : "-"],
                        ["Sold Price", item.soldRetailPrice ? `EUR ${item.soldRetailPrice.toLocaleString("en-US")}` : "-"]
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
                        ["Reservation", item.reservationPlacedAt ? item.reservationPlacedAt.toLocaleDateString("en-US", { dateStyle: "medium" }) : "Open"],
                        ["Test Drive", item.testDriveScheduledAt ? item.testDriveScheduledAt.toLocaleDateString("en-US", { dateStyle: "medium" }) : "Open"],
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
                        Update sales flow
                      </Link>
                      <Link
                        href="/retail"
                        className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)]"
                      >
                        Open retail
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
