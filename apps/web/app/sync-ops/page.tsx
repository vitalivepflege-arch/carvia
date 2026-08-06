import { Card, StatusPill } from "@carvia/ui";
import { requireOnboardedSession } from "../../lib/auth";
import { getProviderSyncWorkspace } from "../../lib/provider-sync";
import { markProviderSyncError, runDueProviderSyncs } from "../providers/actions";

const runTone = {
  ERROR: "danger",
  RESET: "warning",
  SUCCESS: "success"
} as const;

export default async function SyncOpsPage() {
  const session = await requireOnboardedSession();
  const workspace = await getProviderSyncWorkspace(session.user.companyId!);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8f5ee_0%,#e7ece8_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Sync Ops</p>
            <h1 className="mt-2 text-4xl font-semibold text-[var(--navy)]">Integration run operations</h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--foreground-muted)]">
              Operate scheduled provider refreshes, monitor failures, and keep marketplace and routing adapters healthy without leaving Carvia.
            </p>
          </div>
          <form action={runDueProviderSyncs}>
            <button
              type="submit"
              className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10"
            >
              Run due syncs
            </button>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Due Runs", value: String(workspace.summary.dueCount), delta: "Scheduled providers ready now" },
            { label: "Failures", value: String(workspace.summary.failureCount), delta: "Recent reset or error events" },
            { label: "Scheduled", value: String(workspace.summary.scheduledCount), delta: "Cadence-managed adapters" },
            { label: "Stale Syncs", value: String(workspace.summary.staleCount), delta: "No refresh in the last 48h" }
          ].map((metric) => (
            <Card key={metric.label} title={metric.label}>
              <p className="mt-4 text-3xl font-semibold text-[var(--navy)]">{metric.value}</p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">{metric.delta}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card title="Due Scheduled Runs">
            <div className="mt-5 space-y-3">
              {workspace.dueRuns.length === 0 ? (
                <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-5">
                  <p className="font-medium text-[var(--navy)]">No scheduled runs due</p>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                    Connected scheduled providers will appear here once their cadence reaches the next run window.
                  </p>
                </div>
              ) : (
                workspace.dueRuns.map((run) => (
                  <div key={run.providerKey} className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--navy)]">{run.providerName}</p>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                          {run.nextSyncAt ? run.nextSyncAt.toLocaleString("de-DE") : "No schedule"} | every {run.cadenceHours ?? "-"}h
                        </p>
                      </div>
                      <StatusPill tone="warning">{run.status}</StatusPill>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card title="Log Provider Issue">
            <div className="mt-5 rounded-3xl bg-[var(--surface-muted)] p-5">
              <p className="text-sm text-[var(--foreground-muted)]">
                Record an operational failure directly from the workspace to move a provider into visible error state and preserve the incident in sync history.
              </p>
              <form action={markProviderSyncError} className="mt-4 grid gap-4">
                <select
                  name="providerKey"
                  defaultValue="mobile-de"
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)]"
                >
                  <option value="mobile-de">mobile.de Adapter</option>
                  <option value="autoscout24">AutoScout24 Adapter</option>
                  <option value="google-routes">Google Routes Distance</option>
                </select>
                <textarea
                  name="message"
                  rows={4}
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)] outline-none"
                  placeholder="Example: API credentials expired during refresh and returned 401."
                />
                <button
                  type="submit"
                  className="rounded-full border border-[rgba(190,63,51,0.2)] bg-[rgba(190,63,51,0.08)] px-4 py-2 text-sm font-semibold text-[var(--danger)]"
                >
                  Record sync error
                </button>
              </form>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <Card title="Recent Failures">
            <div className="mt-5 space-y-3">
              {workspace.recentFailures.length === 0 ? (
                <p className="text-sm text-[var(--foreground-muted)]">No recent provider failures recorded.</p>
              ) : (
                workspace.recentFailures.slice(0, 8).map((run) => (
                  <div key={run.id} className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--navy)]">{run.providerName}</p>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">{run.createdAt.toLocaleString("de-DE")}</p>
                      </div>
                      <StatusPill tone={runTone[run.status as keyof typeof runTone] ?? "info"}>{run.status}</StatusPill>
                    </div>
                    <p className="mt-3 text-sm text-[var(--foreground)]">{run.message ?? "No message recorded."}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card title="Recent Successful Runs">
            <div className="mt-5 space-y-3">
              {workspace.recentSuccesses.length === 0 ? (
                <p className="text-sm text-[var(--foreground-muted)]">No successful syncs recorded yet.</p>
              ) : (
                workspace.recentSuccesses.slice(0, 8).map((run) => (
                  <div key={run.id} className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--navy)]">{run.providerName}</p>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                          {run.createdAt.toLocaleString("de-DE")} | {run.importedCount} imported
                        </p>
                      </div>
                      <StatusPill tone="success">SUCCESS</StatusPill>
                    </div>
                    <p className="mt-3 text-sm text-[var(--foreground)]">{run.message ?? "No message recorded."}</p>
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
