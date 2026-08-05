import Link from "next/link";
import { Card, StatusPill } from "@carvia/ui";
import { removeWatchlistItem, updateWatchlistNote } from "./actions";
import { requireOnboardedSession } from "../../lib/auth";
import { getWatchlistItems } from "../../lib/watchlist";

export default async function WatchlistPage() {
  const session = await requireOnboardedSession();
  const items = await getWatchlistItems(session.user.companyId!);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#faf8f3_0%,#eff0eb_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Watchlist</p>
            <h1 className="mt-2 text-4xl font-semibold text-[var(--navy)]">Tracked opportunities</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--foreground-muted)]">
              Save strong candidates from your analyses, keep quick notes, and revisit the deals your team should not lose sight of.
            </p>
          </div>
          <Link
            href="/deal-check"
            className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10"
          >
            New Deal Check
          </Link>
        </div>

        {items.length === 0 ? (
          <Card title="No tracked vehicles">
            <div className="mt-5 rounded-3xl bg-[var(--surface-muted)] p-6">
              <p className="text-lg font-medium text-[var(--navy)]">Your watchlist is empty</p>
              <p className="mt-2 max-w-xl text-sm text-[var(--foreground-muted)]">
                Run a Deal Check, open the saved analysis, and add promising inventory to the watchlist for later review.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-5">
            {items.map((item) => (
              <Card
                key={item.id}
                title={`${item.vehicle.make} ${item.vehicle.model}`}
              >
                <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusPill tone="info">{item.vehicle.country ?? "EU stock"}</StatusPill>
                      {item.analysis ? (
                        <>
                          <StatusPill tone="success">Score {item.analysis.dealerScore ?? "-"}</StatusPill>
                          <StatusPill tone="warning">Confidence {item.analysis.confidence ?? "-"}%</StatusPill>
                        </>
                      ) : (
                        <StatusPill tone="warning">No linked analysis</StatusPill>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        ["First Registration", item.vehicle.firstRegistration?.toISOString().slice(0, 7) ?? "-"],
                        ["Mileage", item.vehicle.mileageKm ? `${item.vehicle.mileageKm.toLocaleString("en-US")} km` : "-"],
                        ["Asking Price", item.vehicle.priceGross ? `EUR ${item.vehicle.priceGross.toLocaleString("en-US")}` : "-"],
                        ["Projected Margin", item.analysis?.projectedMargin ? `EUR ${item.analysis.projectedMargin.toLocaleString("en-US")}` : "-"]
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-3xl bg-[var(--surface-muted)] p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">{label}</p>
                          <p className="mt-2 text-base font-medium text-[var(--navy)]">{value}</p>
                        </div>
                      ))}
                    </div>

                    {item.analysis ? (
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href={`/analyses/${item.analysis.id}`}
                          className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)]"
                        >
                          Open analysis
                        </Link>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    <form action={updateWatchlistNote} className="rounded-3xl bg-[var(--surface-muted)] p-4">
                      <input type="hidden" name="watchlistId" value={item.id} />
                      <label className="block">
                        <span className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Internal note</span>
                        <textarea
                          name="note"
                          defaultValue={item.note ?? ""}
                          rows={5}
                          className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)] outline-none"
                          placeholder="What makes this opportunity worth revisiting?"
                        />
                      </label>
                      <button
                        type="submit"
                        className="mt-4 rounded-full bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white"
                      >
                        Save note
                      </button>
                    </form>

                    <form action={removeWatchlistItem}>
                      <input type="hidden" name="watchlistId" value={item.id} />
                      <button
                        type="submit"
                        className="rounded-full border border-[rgba(190,63,51,0.2)] bg-[rgba(190,63,51,0.08)] px-4 py-2 text-sm font-semibold text-[var(--danger)]"
                      >
                        Remove from watchlist
                      </button>
                    </form>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
