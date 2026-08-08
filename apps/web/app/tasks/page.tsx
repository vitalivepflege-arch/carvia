import Link from "next/link";
import { Card, StatusPill } from "@carvia/ui";
import { requireOnboardedSession } from "../../lib/auth";
import { userRoleLabels } from "../../lib/team";
import { getTaskWorkspace, getTaskWorkspaceSummary } from "../../lib/tasks";
import { watchlistStageLabels } from "../../lib/watchlist";
import { completeWatchlistTask, deleteWatchlistTask, reopenWatchlistTask } from "./actions";

const priorityTone = {
  HIGH: "danger",
  LOW: "info",
  MEDIUM: "warning"
} as const;

function formatDueLabel(value: Date | null, isOpen: boolean) {
  if (!value) {
    return "No due date";
  }

  const today = new Date();
  const dueLabel = value.toLocaleDateString("en-US", { dateStyle: "long" });

  if (isOpen && value < new Date(today.toDateString())) {
    return `Overdue since ${dueLabel}`;
  }

  return dueLabel;
}

export default async function TasksPage() {
  const session = await requireOnboardedSession();
  const [tasks, summary] = await Promise.all([
    getTaskWorkspace(session.user.companyId!),
    getTaskWorkspaceSummary(session.user.companyId!)
  ]);
  const openTasks = tasks.filter((task) => task.status === "OPEN");
  const doneTasks = tasks.filter((task) => task.status === "DONE");

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#faf8f3_0%,#eff0eb_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Follow-up Tasks</p>
            <h1 className="mt-2 text-4xl font-semibold text-[var(--navy)]">Opportunity work queue</h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--foreground-muted)]">
              Turn pipeline intent into concrete work: assign callbacks, document checks, pricing reviews, and execution steps per tracked vehicle.
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
            { label: "Open Tasks", value: String(summary.openCount), delta: "Pending follow-up work" },
            { label: "Overdue", value: String(summary.overdueCount), delta: "Open items past their due date" },
            { label: "Automation", value: String(summary.automatedOpenCount), delta: "Rule-generated operating tasks" },
            { label: "Completed", value: String(summary.doneCount), delta: "Closed task history" }
          ].map((metric) => (
            <Card key={metric.label} title={metric.label}>
              <p className="mt-4 text-3xl font-semibold text-[var(--navy)]">{metric.value}</p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">{metric.delta}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: "Buyer Queue", value: String(summary.buyerQueueCount), delta: "Acquisition and next-action work" },
            { label: "Sales Queue", value: String(summary.salesQueueCount), delta: "Lead and test-drive follow-up" },
            { label: "Admin Queue", value: String(summary.adminQueueCount), delta: "Closing, payout, and handover work" }
          ].map((metric) => (
            <Card key={metric.label} title={metric.label}>
              <p className="mt-4 text-3xl font-semibold text-[var(--navy)]">{metric.value}</p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">{metric.delta}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <Card title="Open Follow-ups">
            <div className="mt-5 space-y-4">
              {openTasks.length === 0 ? (
                <div className="rounded-3xl bg-[var(--surface-muted)] p-5">
                  <p className="font-medium text-[var(--navy)]">No open tasks</p>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                    Add follow-up tasks from the watchlist or pipeline to give each opportunity a concrete next move.
                  </p>
                </div>
              ) : (
                openTasks.map((task) => (
                  <div key={task.id} className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-[var(--navy)]">{task.title}</p>
                          {task.origin === "AUTOMATION" ? <StatusPill tone="info">Automation</StatusPill> : null}
                          {task.assigneeRole ? <StatusPill tone="warning">{userRoleLabels[task.assigneeRole]}</StatusPill> : null}
                        </div>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                          {task.vehicle ? `${task.vehicle.make} ${task.vehicle.model}` : "Tracked vehicle"} |{" "}
                          {watchlistStageLabels[task.watchlist.stage]}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusPill tone={priorityTone[task.watchlist.priority]}>{task.watchlist.priority}</StatusPill>
                        <StatusPill tone={task.dueAt && task.dueAt < new Date(new Date().toDateString()) ? "danger" : "info"}>
                          {formatDueLabel(task.dueAt, true)}
                        </StatusPill>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-[var(--foreground)]">
                      Owner: {task.assigneeLabel}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <form action={completeWatchlistTask}>
                        <input type="hidden" name="taskId" value={task.id} />
                        <button
                          type="submit"
                          className="rounded-full bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white"
                        >
                          Mark done
                        </button>
                      </form>
                      <Link
                        href="/watchlist"
                        className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)]"
                      >
                        Open watchlist
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card title="Completed Recently">
            <div className="mt-5 space-y-4">
              {doneTasks.length === 0 ? (
                <div className="rounded-3xl bg-[var(--surface-muted)] p-5">
                  <p className="font-medium text-[var(--navy)]">No completed tasks yet</p>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                    Closed work items will appear here as soon as the team starts resolving follow-ups.
                  </p>
                </div>
              ) : (
                doneTasks.slice(0, 8).map((task) => (
                  <div key={task.id} className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-medium text-[var(--navy)]">{task.title}</p>
                          {task.origin === "AUTOMATION" ? <StatusPill tone="info">Automation</StatusPill> : null}
                          {task.assigneeRole ? <StatusPill tone="warning">{userRoleLabels[task.assigneeRole]}</StatusPill> : null}
                        </div>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                          {task.vehicle ? `${task.vehicle.make} ${task.vehicle.model}` : "Tracked vehicle"} |{" "}
                          {task.completedAt?.toLocaleDateString("en-US", { dateStyle: "medium" }) ?? "Completed"}
                        </p>
                      </div>
                      <StatusPill tone="success">Done</StatusPill>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <form action={reopenWatchlistTask}>
                        <input type="hidden" name="taskId" value={task.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)]"
                        >
                          Reopen
                        </button>
                      </form>
                      <form action={deleteWatchlistTask}>
                        <input type="hidden" name="taskId" value={task.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-[rgba(190,63,51,0.2)] bg-[rgba(190,63,51,0.08)] px-4 py-2 text-sm font-medium text-[var(--danger)]"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
