import Link from "next/link";
import { Card, StatusPill } from "@carvia/ui";
import { removeWatchlistItem, updateWatchlistNote, updateWatchlistWorkflow } from "./actions";
import { requireOnboardedSession } from "../../lib/auth";
import { getWatchlistItems, getWatchlistPipelineSummary } from "../../lib/watchlist";

const priorityTone = {
  HIGH: "danger",
  LOW: "info",
  MEDIUM: "warning"
} as const;

const stageTone = {
  NEGOTIATING: "warning",
  NEW: "info",
  PASSED: "danger",
  READY_TO_BUY: "success",
  REVIEWING: "info"
} as const;

function formatStage(stage: string) {
  return stage
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function WatchlistPage() {
  const session = await requireOnboardedSession();
  const [items, pipelineSummary] = await Promise.all([
    getWatchlistItems(session.user.companyId!),
    getWatchlistPipelineSummary(session.user.companyId!)
  ]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#faf8f3_0%,#eff0eb_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Pipeline Watchlist</p>
            <h1 className="mt-2 text-4xl font-semibold text-[var(--navy)]">Tracked opportunities</h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--foreground-muted)]">
              Move promising vehicles through an acquisition workflow, keep buyer notes current, and surface what needs action next.
            </p>
          </div>
          <Link
            href="/deal-check"
            className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10"
          >
            New Deal Check
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Due Now", value: String(pipelineSummary.dueNowCount), delta: "Actions due on or before August 6, 2026" },
            { label: "High Priority", value: String(pipelineSummary.highPriorityCount), delta: "Urgent opportunities" },
            { label: "Negotiating", value: String(pipelineSummary.negotiatingCount), delta: "Deals in conversation" },
            { label: "Ready To Buy", value: String(pipelineSummary.readyToBuyCount), delta: "Near execution decisions" }
          ].map((metric) => (
            <Card key={metric.label} title={metric.label}>
              <p className="mt-4 text-3xl font-semibold text-[var(--navy)]">{metric.value}</p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">{metric.delta}</p>
            </Card>
          ))}
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
              <Card key={item.id} title={`${item.vehicle.make} ${item.vehicle.model}`}>
                <div className="mt-5 grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusPill tone="info">{item.vehicle.country ?? "EU stock"}</StatusPill>
                      <StatusPill tone={stageTone[item.stage]}>{formatStage(item.stage)}</StatusPill>
                      <StatusPill tone={priorityTone[item.priority]}>{item.priority} Priority</StatusPill>
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

                    <div className="rounded-3xl bg-[var(--surface-muted)] p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Next action date</p>
                      <p className="mt-2 text-base font-medium text-[var(--navy)]">
                        {item.nextActionAt
                          ? item.nextActionAt.toLocaleDateString("en-US", { dateStyle: "long" })
                          : "Not scheduled yet"}
                      </p>
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
                    <form action={updateWatchlistWorkflow} className="rounded-3xl bg-[var(--surface-muted)] p-4">
                      <input type="hidden" name="watchlistId" value={item.id} />
                      <div className="grid gap-4">
                        <label className="block">
                          <span className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Pipeline stage</span>
                          <select
                            name="stage"
                            defaultValue={item.stage}
                            className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                          >
                            <option value="NEW">New</option>
                            <option value="REVIEWING">Reviewing</option>
                            <option value="NEGOTIATING">Negotiating</option>
                            <option value="READY_TO_BUY">Ready to buy</option>
                            <option value="PASSED">Passed</option>
                          </select>
                        </label>

                        <label className="block">
                          <span className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Priority</span>
                          <select
                            name="priority"
                            defaultValue={item.priority}
                            className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                          >
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                          </select>
                        </label>

                        <label className="block">
                          <span className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Next action date</span>
                          <input
                            name="nextActionAt"
                            type="date"
                            defaultValue={item.nextActionAt ? item.nextActionAt.toISOString().slice(0, 10) : ""}
                            className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                          />
                        </label>

                        <button
                          type="submit"
                          className="rounded-full bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white"
                        >
                          Save workflow
                        </button>
                      </div>
                    </form>

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
