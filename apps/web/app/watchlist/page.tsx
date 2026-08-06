import Link from "next/link";
import { Card, StatusPill } from "@carvia/ui";
import { activityTypeLabels } from "../../lib/activities";
import { contactChannelLabels } from "../../lib/contacts";
import { createWatchlistActivity, deleteWatchlistActivity } from "../activities/actions";
import { createWatchlistContact, deleteWatchlistContact } from "../contacts/actions";
import { completeWatchlistTask, createWatchlistTask } from "../tasks/actions";
import { requireOnboardedSession } from "../../lib/auth";
import {
  getWatchlistItems,
  getWatchlistPipelineSummary,
  watchlistClosingStatusLabels,
  watchlistOfferStatusLabels
} from "../../lib/watchlist";
import { removeWatchlistItem, updateWatchlistNote, updateWatchlistWorkflow } from "./actions";

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

const activityTone = {
  CALL: "warning",
  DOCUMENT: "info",
  EMAIL: "success",
  MEETING: "danger",
  MESSAGE: "info",
  NOTE: "info"
} as const;

const contactTone = {
  CALL: "warning",
  EMAIL: "success",
  MESSAGE: "info"
} as const;

const offerTone = {
  ACCEPTED: "success",
  COUNTER_RECEIVED: "warning",
  NONE: "info",
  OFFER_SENT: "warning",
  PREPARING: "info",
  REJECTED: "danger"
} as const;

const closingTone = {
  CANCELLED: "danger",
  COMPLETED: "success",
  NONE: "info",
  PAPERWORK_PENDING: "warning",
  PAYMENT_PENDING: "warning",
  TRANSPORT_BOOKED: "info"
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
  const dueDateLabel = new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date());
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
            { label: "Due Now", value: String(pipelineSummary.dueNowCount), delta: `Actions due on or before ${dueDateLabel}` },
            { label: "High Priority", value: String(pipelineSummary.highPriorityCount), delta: "Urgent opportunities" },
            { label: "Negotiating", value: String(pipelineSummary.negotiatingCount), delta: "Deals in conversation" },
            { label: "Active Closings", value: String(pipelineSummary.activeClosingCount), delta: "Paperwork, payment, transport" }
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
                      <StatusPill tone={offerTone[item.offerStatus]}>{watchlistOfferStatusLabels[item.offerStatus]}</StatusPill>
                      <StatusPill tone={closingTone[item.closingStatus]}>{watchlistClosingStatusLabels[item.closingStatus]}</StatusPill>
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
                        ["Projected Margin", item.analysis?.projectedMargin ? `EUR ${item.analysis.projectedMargin.toLocaleString("en-US")}` : "-"],
                        ["Target Buy", item.targetBuyPrice ? `EUR ${item.targetBuyPrice.toLocaleString("en-US")}` : "-"],
                        ["Last Offer", item.latestOfferPrice ? `EUR ${item.latestOfferPrice.toLocaleString("en-US")}` : "-"],
                        ["Counter", item.counterOfferPrice ? `EUR ${item.counterOfferPrice.toLocaleString("en-US")}` : "-"],
                        ["Closing Target", item.closingTargetDate ? item.closingTargetDate.toLocaleDateString("en-US", { dateStyle: "medium" }) : "-"]
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

                    <div className="rounded-3xl bg-[var(--surface-muted)] p-4">
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
                    </div>

                    <div className="rounded-3xl bg-[var(--surface-muted)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Open tasks</p>
                        <StatusPill tone={item.openTasks.length > 0 ? "warning" : "info"}>{item.openTasks.length}</StatusPill>
                      </div>
                      <div className="mt-3 space-y-3">
                        {item.openTasks.length === 0 ? (
                          <p className="text-sm text-[var(--foreground-muted)]">No follow-up tasks yet.</p>
                        ) : (
                          item.openTasks.slice(0, 3).map((task) => (
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

                    <div className="rounded-3xl bg-[var(--surface-muted)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Contacts</p>
                        <StatusPill tone={item.contacts.length > 0 ? "success" : "info"}>{item.contacts.length}</StatusPill>
                      </div>
                      <div className="mt-3 space-y-3">
                        {item.contacts.length === 0 ? (
                          <p className="text-sm text-[var(--foreground-muted)]">No contact person saved yet.</p>
                        ) : (
                          item.contacts.slice(0, 3).map((contact) => (
                            <div key={contact.id} className="rounded-2xl border border-[var(--border)] bg-white p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <StatusPill tone={contactTone[contact.preferredChannel]}>{contactChannelLabels[contact.preferredChannel]}</StatusPill>
                                  </div>
                                  <p className="mt-2 text-sm font-medium text-[var(--navy)]">{contact.fullName}</p>
                                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
                                    {[contact.roleLabel ?? "Role open", contact.companyName ?? "Company open"].join(" | ")}
                                  </p>
                                  <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                                    {[contact.email ?? "-", contact.phone ?? "-"].join(" | ")}
                                  </p>
                                </div>
                                <form action={deleteWatchlistContact}>
                                  <input type="hidden" name="contactId" value={contact.id} />
                                  <button type="submit" className="text-xs font-semibold text-[var(--danger)] underline-offset-4 hover:underline">
                                    Delete
                                  </button>
                                </form>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="rounded-3xl bg-[var(--surface-muted)] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Recent activity</p>
                        <StatusPill tone={item.recentActivities.length > 0 ? "success" : "info"}>{item.recentActivities.length}</StatusPill>
                      </div>
                      <div className="mt-3 space-y-3">
                        {item.recentActivities.length === 0 ? (
                          <p className="text-sm text-[var(--foreground-muted)]">No contact log yet.</p>
                        ) : (
                          item.recentActivities.slice(0, 3).map((activity) => (
                            <div key={activity.id} className="rounded-2xl border border-[var(--border)] bg-white p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <StatusPill tone={activityTone[activity.type]}>{activityTypeLabels[activity.type]}</StatusPill>
                                  </div>
                                  <p className="mt-2 text-sm font-medium text-[var(--navy)]">{activity.summary}</p>
                                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
                                    {activity.createdByName ?? "Unknown teammate"} |{" "}
                                    {activity.happenedAt.toLocaleDateString("en-US", { dateStyle: "medium" })}
                                  </p>
                                </div>
                                <form action={deleteWatchlistActivity}>
                                  <input type="hidden" name="activityId" value={activity.id} />
                                  <button type="submit" className="text-xs font-semibold text-[var(--danger)] underline-offset-4 hover:underline">
                                    Delete
                                  </button>
                                </form>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
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

                        <label className="block">
                          <span className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Offer status</span>
                          <select
                            name="offerStatus"
                            defaultValue={item.offerStatus}
                            className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                          >
                            <option value="NONE">No offer</option>
                            <option value="PREPARING">Preparing</option>
                            <option value="OFFER_SENT">Offer sent</option>
                            <option value="COUNTER_RECEIVED">Counter received</option>
                            <option value="ACCEPTED">Accepted</option>
                            <option value="REJECTED">Rejected</option>
                          </select>
                        </label>

                        <label className="block">
                          <span className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Closing status</span>
                          <select
                            name="closingStatus"
                            defaultValue={item.closingStatus}
                            className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                          >
                            <option value="NONE">No closing</option>
                            <option value="PAPERWORK_PENDING">Paperwork pending</option>
                            <option value="PAYMENT_PENDING">Payment pending</option>
                            <option value="TRANSPORT_BOOKED">Transport booked</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                          </select>
                        </label>

                        <label className="block">
                          <span className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Target buy price</span>
                          <input
                            name="targetBuyPrice"
                            type="number"
                            step="0.01"
                            defaultValue={item.targetBuyPrice ?? ""}
                            className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                          />
                        </label>

                        <label className="block">
                          <span className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Latest offer price</span>
                          <input
                            name="latestOfferPrice"
                            type="number"
                            step="0.01"
                            defaultValue={item.latestOfferPrice ?? ""}
                            className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                          />
                        </label>

                        <label className="block">
                          <span className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Counter offer price</span>
                          <input
                            name="counterOfferPrice"
                            type="number"
                            step="0.01"
                            defaultValue={item.counterOfferPrice ?? ""}
                            className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                          />
                        </label>

                        <label className="block">
                          <span className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Closing target date</span>
                          <input
                            name="closingTargetDate"
                            type="date"
                            defaultValue={item.closingTargetDate ? item.closingTargetDate.toISOString().slice(0, 10) : ""}
                            className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                          />
                        </label>

                        <label className="block">
                          <span className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Paperwork completed</span>
                          <input
                            name="paperworkCompletedAt"
                            type="date"
                            defaultValue={item.paperworkCompletedAt ? item.paperworkCompletedAt.toISOString().slice(0, 10) : ""}
                            className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                          />
                        </label>

                        <label className="block">
                          <span className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Payment completed</span>
                          <input
                            name="paymentCompletedAt"
                            type="date"
                            defaultValue={item.paymentCompletedAt ? item.paymentCompletedAt.toISOString().slice(0, 10) : ""}
                            className="mt-3 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                          />
                        </label>

                        <label className="block">
                          <span className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Handoff completed</span>
                          <input
                            name="handoffCompletedAt"
                            type="date"
                            defaultValue={item.handoffCompletedAt ? item.handoffCompletedAt.toISOString().slice(0, 10) : ""}
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

                    <form action={createWatchlistTask} className="rounded-3xl bg-[var(--surface-muted)] p-4">
                      <input type="hidden" name="watchlistId" value={item.id} />
                      <p className="text-sm font-medium text-[var(--navy)]">Add follow-up task</p>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                        Turn this opportunity into a concrete callback, document check, or pricing task.
                      </p>
                      <div className="mt-4 grid gap-4">
                        <input
                          name="title"
                          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                          placeholder="Call seller and verify service history"
                        />
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
                          className="rounded-full bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white"
                        >
                          Save task
                        </button>
                      </div>
                    </form>

                    <form action={createWatchlistActivity} className="rounded-3xl bg-[var(--surface-muted)] p-4">
                      <input type="hidden" name="watchlistId" value={item.id} />
                      <p className="text-sm font-medium text-[var(--navy)]">Log activity</p>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                        Capture calls, emails, meetings, document checks, and negotiation updates.
                      </p>
                      <div className="mt-4 grid gap-4">
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
                          placeholder="Seller confirmed service book is complete"
                        />
                        <textarea
                          name="details"
                          rows={3}
                          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)] outline-none"
                          placeholder="Optional context for the team"
                        />
                        <input
                          name="happenedAt"
                          type="date"
                          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                        />
                        <button
                          type="submit"
                          className="rounded-full bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white"
                        >
                          Save activity
                        </button>
                      </div>
                    </form>

                    <form action={createWatchlistContact} className="rounded-3xl bg-[var(--surface-muted)] p-4">
                      <input type="hidden" name="watchlistId" value={item.id} />
                      <p className="text-sm font-medium text-[var(--navy)]">Add contact</p>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                        Save the seller, broker, or verification contact directly on this opportunity.
                      </p>
                      <div className="mt-4 grid gap-4">
                        <input
                          name="fullName"
                          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                          placeholder="Anna Becker"
                        />
                        <input
                          name="companyName"
                          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                          placeholder="Seller company"
                        />
                        <input
                          name="roleLabel"
                          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                          placeholder="Sales manager"
                        />
                        <input
                          name="email"
                          type="email"
                          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                          placeholder="anna@example.com"
                        />
                        <input
                          name="phone"
                          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                          placeholder="+49 170 1234567"
                        />
                        <select
                          name="preferredChannel"
                          defaultValue="CALL"
                          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                        >
                          <option value="CALL">Call</option>
                          <option value="EMAIL">Email</option>
                          <option value="MESSAGE">Message</option>
                        </select>
                        <input
                          name="lastContactedAt"
                          type="date"
                          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                        />
                        <textarea
                          name="notes"
                          rows={3}
                          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)] outline-none"
                          placeholder="Optional contact notes"
                        />
                        <button
                          type="submit"
                          className="rounded-full bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white"
                        >
                          Save contact
                        </button>
                      </div>
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
