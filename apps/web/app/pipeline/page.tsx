import Link from "next/link";
import { Card, StatusPill } from "@carvia/ui";
import { activityTypeLabels } from "../../lib/activities";
import { createWatchlistActivity } from "../activities/actions";
import { completeWatchlistTask, createWatchlistTask } from "../tasks/actions";
import { requireOnboardedSession } from "../../lib/auth";
import { getWatchlistItems, getWatchlistPipelineSummary, watchlistStageLabels, watchlistStageOrder } from "../../lib/watchlist";
import { updateWatchlistWorkflow } from "../watchlist/actions";

const priorityTone = {
  HIGH: "danger",
  LOW: "info",
  MEDIUM: "warning"
} as const;

const stageAccent = {
  NEGOTIATING: "border-[rgba(202,123,25,0.24)] bg-[rgba(202,123,25,0.08)]",
  NEW: "border-[rgba(17,37,59,0.1)] bg-white/70",
  PASSED: "border-[rgba(190,63,51,0.24)] bg-[rgba(190,63,51,0.06)]",
  READY_TO_BUY: "border-[rgba(31,140,84,0.24)] bg-[rgba(31,140,84,0.08)]",
  REVIEWING: "border-[rgba(50,85,120,0.18)] bg-[rgba(17,37,59,0.04)]"
} as const;

const activityTone = {
  CALL: "warning",
  DOCUMENT: "info",
  EMAIL: "success",
  MEETING: "danger",
  MESSAGE: "info",
  NOTE: "info"
} as const;

function formatDate(value: Date | null) {
  return value ? value.toLocaleDateString("en-US", { dateStyle: "medium" }) : "No date";
}

export default async function PipelinePage() {
  const session = await requireOnboardedSession();
  const dueDateLabel = new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date());
  const [items, pipelineSummary] = await Promise.all([
    getWatchlistItems(session.user.companyId!),
    getWatchlistPipelineSummary(session.user.companyId!)
  ]);

  const groupedItems = Object.fromEntries(
    watchlistStageOrder.map((stage) => [stage, items.filter((item) => item.stage === stage)])
  ) as Record<(typeof watchlistStageOrder)[number], typeof items>;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f9f6ef_0%,#e8ecea_52%,#f4f1ea_100%)] px-6 py-10">
      <div className="mx-auto max-w-[1500px] space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Acquisition Pipeline</p>
            <h1 className="mt-2 text-4xl font-semibold text-[var(--navy)]">Board view for sourcing decisions</h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--foreground-muted)]">
              Steer every tracked vehicle through one shared workflow, keep next actions visible, and move opportunities from first review to buy-ready execution.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/watchlist"
              className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--navy)]"
            >
              Open list view
            </Link>
            <Link
              href="/deal-check"
              className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10"
            >
              New Deal Check
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Due Now", value: String(pipelineSummary.dueNowCount), delta: `Actions due on or before ${dueDateLabel}` },
            { label: "High Priority", value: String(pipelineSummary.highPriorityCount), delta: "Immediate acquisition focus" },
            { label: "Negotiating", value: String(pipelineSummary.negotiatingCount), delta: "Active seller conversations" },
            { label: "Open Tasks", value: String(pipelineSummary.openTaskCount), delta: "Team follow-ups in motion" }
          ].map((metric) => (
            <Card key={metric.label} title={metric.label}>
              <p className="mt-4 text-3xl font-semibold text-[var(--navy)]">{metric.value}</p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">{metric.delta}</p>
            </Card>
          ))}
        </div>

        {items.length === 0 ? (
          <Card title="Pipeline empty">
            <div className="mt-5 rounded-3xl bg-[var(--surface-muted)] p-6">
              <p className="text-lg font-medium text-[var(--navy)]">No opportunities in the pipeline yet</p>
              <p className="mt-2 max-w-xl text-sm text-[var(--foreground-muted)]">
                Add vehicles from Deal Check or Market Search to the watchlist and they will appear here as soon as they enter your acquisition workflow.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-5 xl:grid-cols-5">
            {watchlistStageOrder.map((stage) => (
              <section
                key={stage}
                className={`rounded-[30px] border p-4 shadow-xl shadow-slate-900/5 backdrop-blur ${stageAccent[stage]}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Stage</p>
                    <h2 className="mt-2 text-xl font-semibold text-[var(--navy)]">{watchlistStageLabels[stage]}</h2>
                  </div>
                  <StatusPill tone={stage === "PASSED" ? "danger" : stage === "READY_TO_BUY" ? "success" : stage === "NEGOTIATING" ? "warning" : "info"}>
                    {groupedItems[stage].length}
                  </StatusPill>
                </div>

                <div className="mt-4 space-y-4">
                  {groupedItems[stage].length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-[var(--border)] bg-white/70 p-4 text-sm text-[var(--foreground-muted)]">
                      No vehicles in this stage.
                    </div>
                  ) : (
                    groupedItems[stage].map((item) => (
                      <article key={item.id} className="rounded-3xl border border-[var(--border)] bg-white/88 p-4 shadow-lg shadow-slate-900/5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-semibold text-[var(--navy)]">
                              {item.vehicle.make} {item.vehicle.model}
                            </p>
                            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                              {item.vehicle.firstRegistration?.toISOString().slice(0, 7) ?? "Unknown year"} |{" "}
                              {item.vehicle.mileageKm ? `${item.vehicle.mileageKm.toLocaleString("en-US")} km` : "Mileage open"}
                            </p>
                          </div>
                          <StatusPill tone={priorityTone[item.priority]}>{item.priority}</StatusPill>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-[var(--surface-muted)] p-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Asking</p>
                            <p className="mt-2 text-sm font-medium text-[var(--navy)]">
                              {item.vehicle.priceGross ? `EUR ${item.vehicle.priceGross.toLocaleString("en-US")}` : "-"}
                            </p>
                          </div>
                          <div className="rounded-2xl bg-[var(--surface-muted)] p-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Projected Margin</p>
                            <p className="mt-2 text-sm font-medium text-[var(--navy)]">
                              {item.analysis?.projectedMargin ? `EUR ${item.analysis.projectedMargin.toLocaleString("en-US")}` : "-"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <StatusPill tone="info">{item.vehicle.country ?? "EU stock"}</StatusPill>
                          {item.analysis ? <StatusPill tone="success">Score {item.analysis.dealerScore ?? "-"}</StatusPill> : null}
                          {item.analysis ? <StatusPill tone="warning">Confidence {item.analysis.confidence ?? "-"}%</StatusPill> : null}
                        </div>

                        <div className="mt-4 rounded-2xl bg-[var(--surface-muted)] p-3">
                          <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Next action</p>
                          <p className="mt-2 text-sm font-medium text-[var(--navy)]">{formatDate(item.nextActionAt)}</p>
                        </div>

                        <div className="mt-4 rounded-2xl bg-[var(--surface-muted)] p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Open tasks</p>
                            <StatusPill tone={item.openTasks.length > 0 ? "warning" : "info"}>{item.openTasks.length}</StatusPill>
                          </div>
                          <div className="mt-3 space-y-3">
                            {item.openTasks.length === 0 ? (
                              <p className="text-sm text-[var(--foreground-muted)]">No task attached yet.</p>
                            ) : (
                              item.openTasks.slice(0, 2).map((task) => (
                                <div key={task.id} className="rounded-2xl border border-[var(--border)] bg-white p-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-medium text-[var(--navy)]">{task.title}</p>
                                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
                                        {task.assigneeName ?? "Unassigned"} |{" "}
                                        {task.dueAt ? task.dueAt.toLocaleDateString("en-US", { dateStyle: "medium" }) : "No due date"}
                                      </p>
                                    </div>
                                    <form action={completeWatchlistTask}>
                                      <input type="hidden" name="taskId" value={task.id} />
                                      <button type="submit" className="text-xs font-semibold text-[var(--navy)] underline-offset-4 hover:underline">
                                        Done
                                      </button>
                                    </form>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl bg-[var(--surface-muted)] p-3">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Recent activity</p>
                            <StatusPill tone={item.recentActivities.length > 0 ? "success" : "info"}>{item.recentActivities.length}</StatusPill>
                          </div>
                          <div className="mt-3 space-y-3">
                            {item.recentActivities.length === 0 ? (
                              <p className="text-sm text-[var(--foreground-muted)]">No contact log yet.</p>
                            ) : (
                              item.recentActivities.slice(0, 2).map((activity) => (
                                <div key={activity.id} className="rounded-2xl border border-[var(--border)] bg-white p-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <StatusPill tone={activityTone[activity.type]}>{activityTypeLabels[activity.type]}</StatusPill>
                                  </div>
                                  <p className="mt-2 text-sm font-medium text-[var(--navy)]">{activity.summary}</p>
                                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
                                    {activity.happenedAt.toLocaleDateString("en-US", { dateStyle: "medium" })}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {item.note ? (
                          <div className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-3">
                            <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Internal note</p>
                            <p className="mt-2 text-sm text-[var(--foreground)]">{item.note}</p>
                          </div>
                        ) : null}

                        <form action={updateWatchlistWorkflow} className="mt-4 space-y-3">
                          <input type="hidden" name="watchlistId" value={item.id} />
                          <input type="hidden" name="priority" value={item.priority} />
                          <input
                            type="hidden"
                            name="nextActionAt"
                            value={item.nextActionAt ? item.nextActionAt.toISOString().slice(0, 10) : ""}
                          />
                          <label className="block">
                            <span className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Move to stage</span>
                            <select
                              name="stage"
                              defaultValue={item.stage}
                              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                            >
                              {watchlistStageOrder.map((option) => (
                                <option key={option} value={option}>
                                  {watchlistStageLabels[option]}
                                </option>
                              ))}
                            </select>
                          </label>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <button
                              type="submit"
                              className="rounded-full bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white"
                            >
                              Update stage
                            </button>
                            {item.analysis ? (
                              <Link href={`/analyses/${item.analysis.id}`} className="text-sm font-medium text-[var(--navy)] underline-offset-4 hover:underline">
                                Open analysis
                              </Link>
                            ) : (
                              <Link href="/watchlist" className="text-sm font-medium text-[var(--navy)] underline-offset-4 hover:underline">
                                Edit details
                              </Link>
                            )}
                          </div>
                        </form>

                        <form action={createWatchlistTask} className="mt-4 space-y-3">
                          <input type="hidden" name="watchlistId" value={item.id} />
                          <label className="block">
                            <span className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Add task</span>
                            <input
                              name="title"
                              className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                              placeholder="Prepare negotiation call"
                            />
                          </label>
                          <input
                            name="assigneeName"
                            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                            placeholder="Owner or teammate"
                          />
                          <input
                            name="dueAt"
                            type="date"
                            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                          />
                          <button
                            type="submit"
                            className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)]"
                          >
                            Save task
                          </button>
                        </form>

                        <form action={createWatchlistActivity} className="mt-4 space-y-3">
                          <input type="hidden" name="watchlistId" value={item.id} />
                          <select
                            name="type"
                            defaultValue="CALL"
                            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                          >
                            <option value="CALL">Call</option>
                            <option value="EMAIL">Email</option>
                            <option value="MESSAGE">Message</option>
                            <option value="DOCUMENT">Document</option>
                            <option value="MEETING">Meeting</option>
                            <option value="NOTE">Internal note</option>
                          </select>
                          <input
                            name="summary"
                            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                            placeholder="Seller accepted next negotiation slot"
                          />
                          <textarea
                            name="details"
                            rows={3}
                            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)] outline-none"
                            placeholder="Optional team context"
                          />
                          <input
                            name="happenedAt"
                            type="date"
                            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                          />
                          <button
                            type="submit"
                            className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)]"
                          >
                            Save activity
                          </button>
                        </form>
                      </article>
                    ))
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
