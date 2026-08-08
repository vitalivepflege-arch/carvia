import Link from "next/link";
import { Card, StatusPill } from "@carvia/ui";
import { requireOnboardedSession } from "../../lib/auth";
import { activityTypeLabels, getActivityWorkspace } from "../../lib/activities";
import { watchlistStageLabels } from "../../lib/watchlist";
import { deleteWatchlistActivity } from "./actions";

const priorityTone = {
  HIGH: "danger",
  LOW: "info",
  MEDIUM: "warning"
} as const;

const activityTone = {
  CALL: "warning",
  DOCUMENT: "info",
  EMAIL: "success",
  MEETING: "danger",
  MESSAGE: "info",
  NOTE: "info"
} as const;

export default async function ActivitiesPage() {
  const session = await requireOnboardedSession();
  const activities = await getActivityWorkspace(session.user.companyId!);
  const today = new Date();
  const thisWeekCount = activities.filter((activity) => activity.happenedAt >= new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)).length;
  const callCount = activities.filter((activity) => activity.type === "CALL").length;
  const automationCount = activities.filter((activity) => activity.createdByName === "Carvia Automation").length;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#faf8f3_0%,#eff0eb_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Deal Activity</p>
            <h1 className="mt-2 text-4xl font-semibold text-[var(--navy)]">Opportunity communication log</h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--foreground-muted)]">
              Keep a structured timeline of calls, emails, messages, meetings, and document steps so every buyer sees how a deal is progressing.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/watchlist"
              className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--navy)]"
            >
              Open watchlist
            </Link>
            <Link
              href="/pipeline"
              className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10"
            >
              Open pipeline
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Entries", value: String(activities.length), delta: "Logged deal interactions" },
            { label: "This Week", value: String(thisWeekCount), delta: "Recent activity volume" },
            { label: "Automation", value: String(automationCount), delta: "System-generated operating history" },
            { label: "Calls", value: String(callCount), delta: "Phone touchpoints" }
          ].map((metric) => (
            <Card key={metric.label} title={metric.label}>
              <p className="mt-4 text-3xl font-semibold text-[var(--navy)]">{metric.value}</p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">{metric.delta}</p>
            </Card>
          ))}
        </div>

        <Card title="Recent Activity">
          <div className="mt-5 space-y-4">
            {activities.length === 0 ? (
              <div className="rounded-3xl bg-[var(--surface-muted)] p-5">
                <p className="font-medium text-[var(--navy)]">No activity logged yet</p>
                <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                  Add the first contact or document update from the watchlist, pipeline, or analysis detail page.
                </p>
              </div>
            ) : (
              activities.map((activity) => (
                <div key={activity.id} className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone={activityTone[activity.type]}>{activityTypeLabels[activity.type]}</StatusPill>
                        <StatusPill tone={priorityTone[activity.watchlist.priority]}>{activity.watchlist.priority}</StatusPill>
                        {activity.createdByName === "Carvia Automation" ? <StatusPill tone="info">Automation</StatusPill> : null}
                      </div>
                      <p className="mt-3 font-medium text-[var(--navy)]">{activity.summary}</p>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                        {activity.vehicle ? `${activity.vehicle.make} ${activity.vehicle.model}` : "Tracked vehicle"} |{" "}
                        {watchlistStageLabels[activity.watchlist.stage]}
                      </p>
                    </div>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      {activity.happenedAt.toLocaleDateString("en-US", { dateStyle: "long" })}
                    </p>
                  </div>

                  {activity.details ? (
                    <p className="mt-3 text-sm text-[var(--foreground)]">{activity.details}</p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-[var(--foreground-muted)]">
                      Logged by {activity.createdByName ?? "Unknown teammate"}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href="/watchlist"
                        className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)]"
                      >
                        Open watchlist
                      </Link>
                      <form action={deleteWatchlistActivity}>
                        <input type="hidden" name="activityId" value={activity.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-[rgba(190,63,51,0.2)] bg-[rgba(190,63,51,0.08)] px-4 py-2 text-sm font-medium text-[var(--danger)]"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
