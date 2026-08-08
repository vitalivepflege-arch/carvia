import { Card, StatusPill } from "@carvia/ui";
import { requireOnboardedSession } from "../../lib/auth";
import { getAutomationWorkspace } from "../../lib/automation";
import { runAutomationMaintenance } from "./actions";

export default async function AutomationOpsPage() {
  const session = await requireOnboardedSession();
  const workspace = await getAutomationWorkspace(session.user.companyId!);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f6f3ea_0%,#e6ece8_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Automation</p>
            <h1 className="mt-2 text-4xl font-semibold text-[var(--navy)]">Rule engine operations</h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--foreground-muted)]">
              Run rule-based maintenance across stock aging, sales progression, and customer follow-up so the operating system can self-correct key workflow gaps.
            </p>
          </div>
          <form action={runAutomationMaintenance}>
            <button
              type="submit"
              className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10"
            >
              Run automation now
            </button>
          </form>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Overdue Escalations", value: String(workspace.summary.overdueStockCandidates), delta: "Units above target stock days" },
            { label: "Lead Syncs", value: String(workspace.summary.leadSyncCandidates), delta: "Live units with leads but no sales state" },
            { label: "Test Drive Follow-ups", value: String(workspace.summary.testDriveCandidates), delta: "Scheduled appointments without next action" },
            { label: "Won-to-Sold Syncs", value: String(workspace.summary.soldSyncCandidates), delta: "Won deals missing sold date" }
          ].map((metric) => (
            <Card key={metric.label} title={metric.label}>
              <p className="mt-4 text-3xl font-semibold text-[var(--navy)]">{metric.value}</p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">{metric.delta}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {[
            { label: "Due Cadence Tasks", value: String(workspace.summary.dueActionCandidates), delta: "Watchlist entries with next action due now" },
            { label: "Open Automation Tasks", value: String(workspace.summary.openAutomationTasks), delta: "Rule-generated operating work still open" }
          ].map((metric) => (
            <Card key={metric.label} title={metric.label}>
              <p className="mt-4 text-3xl font-semibold text-[var(--navy)]">{metric.value}</p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">{metric.delta}</p>
            </Card>
          ))}
        </div>

        <Card title="Recent Automation Runs">
          <div className="mt-5 space-y-4">
            {workspace.recentRuns.length === 0 ? (
              <div className="rounded-3xl bg-[var(--surface-muted)] p-5">
                <p className="font-medium text-[var(--navy)]">No automation runs yet</p>
                <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                  Run the rule engine once to create the first operation log and apply automatic workflow maintenance.
                </p>
              </div>
            ) : (
              workspace.recentRuns.map((run) => (
                <div key={run.id} className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[var(--navy)]">{run.runType.replaceAll("_", " ")}</p>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">{run.createdAt.toLocaleString("en-US")}</p>
                    </div>
                    <StatusPill tone={run.status === "COMPLETED" ? "success" : "warning"}>{run.status}</StatusPill>
                  </div>
                  <p className="mt-3 text-sm text-[var(--foreground)]">
                    Updated {run.updatedCount} records | Escalated {run.escalatedCount} units
                  </p>
                  <div className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-4">
                    <pre className="whitespace-pre-wrap font-mono text-xs text-[var(--foreground)]">{run.preview}</pre>
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
