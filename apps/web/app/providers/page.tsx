import { Card, StatusPill } from "@carvia/ui";
import { requireOnboardedSession } from "../../lib/auth";
import { getProviderControlSummary, getProviderOverview } from "../../lib/providers";
import { markProviderSync, resetProviderCredential, upsertProviderCredential } from "./actions";

const statusTone = {
  CONNECTED: "success",
  DISABLED: "warning",
  ERROR: "danger",
  NOT_CONFIGURED: "info"
} as const;

const runTone = {
  RESET: "warning",
  SUCCESS: "success"
} as const;

export default async function ProvidersPage() {
  const session = await requireOnboardedSession();
  const [providers, controlSummary] = await Promise.all([
    getProviderOverview(session.user.companyId!),
    getProviderControlSummary(session.user.companyId!)
  ]);
  const todayLabel = new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(new Date());

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#faf8f3_0%,#eff0eb_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Providers</p>
          <h1 className="mt-2 text-4xl font-semibold text-[var(--navy)]">Integration readiness</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--foreground-muted)]">
            Carvia keeps every live data source behind explicit provider boundaries. Mock mode stays available for local development, while external sources remain disabled until credentials and compliance approval are in place.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Connected", value: String(controlSummary.connectedCount), delta: "Providers marked connected" },
            { label: "Scheduled", value: String(controlSummary.scheduledCount), delta: "Cadence-driven sync setups" },
            { label: "Due Now", value: String(controlSummary.dueSyncCount), delta: `Scheduled runs due on or before ${todayLabel}` },
            { label: "Catalog", value: String(providers.length), delta: "Known adapter boundaries" }
          ].map((metric) => (
            <Card key={metric.label} title={metric.label}>
              <p className="mt-4 text-3xl font-semibold text-[var(--navy)]">{metric.value}</p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">{metric.delta}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {providers.map((provider) => {
            const isMock = provider.providerKey === "mock";

            return (
              <Card key={provider.providerKey} title={provider.displayName}>
                <div className="mt-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--navy)]">{provider.type}</p>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">{provider.providerKey}</p>
                    </div>
                    <StatusPill tone={statusTone[provider.status]}>{provider.status.replaceAll("_", " ")}</StatusPill>
                  </div>

                  <div className="rounded-3xl bg-[var(--surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Status note</p>
                    <p className="mt-2 text-sm text-[var(--foreground)]">{provider.credentialsHint}</p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-3xl border border-[var(--border)] bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Last sync</p>
                      <p className="mt-2 text-sm font-medium text-[var(--navy)]">
                        {provider.lastSyncAt ? new Date(provider.lastSyncAt).toLocaleString("de-DE") : "Not synced yet"}
                      </p>
                    </div>
                    <div className="rounded-3xl border border-[var(--border)] bg-white p-4">
                      <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Next sync</p>
                      <p className="mt-2 text-sm font-medium text-[var(--navy)]">
                        {provider.nextSyncAt ? new Date(provider.nextSyncAt).toLocaleString("de-DE") : isMock ? "Mock provider" : "Not scheduled"}
                      </p>
                    </div>
                  </div>

                  {isMock ? (
                    <div className="rounded-3xl border border-[var(--border)] bg-white p-4">
                      <p className="text-sm font-medium text-[var(--navy)]">Mock provider</p>
                      <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                        This adapter is intentionally fixed in development mode and does not require tenant-managed credentials.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
                      <form action={upsertProviderCredential} className="rounded-3xl border border-[var(--border)] bg-white p-4">
                        <input type="hidden" name="providerKey" value={provider.providerKey} />
                        <div className="grid gap-4">
                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-[var(--navy)]">Connection status</span>
                            <select
                              name="status"
                              defaultValue={provider.status}
                              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                            >
                              <option value="NOT_CONFIGURED">Not configured</option>
                              <option value="CONNECTED">Connected</option>
                              <option value="DISABLED">Disabled</option>
                              <option value="ERROR">Error</option>
                            </select>
                          </label>

                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-[var(--navy)]">Sync mode</span>
                            <select
                              name="syncMode"
                              defaultValue={provider.syncMode}
                              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                            >
                              <option value="MANUAL">Manual only</option>
                              <option value="SCHEDULED">Scheduled cadence</option>
                              <option value="PAUSED">Paused</option>
                            </select>
                          </label>

                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-[var(--navy)]">Cadence hours</span>
                            <input
                              name="cadenceHours"
                              type="number"
                              min={1}
                              max={168}
                              defaultValue={provider.cadenceHours ?? 24}
                              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                            />
                          </label>

                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-[var(--navy)]">Credentials hint</span>
                            <textarea
                              name="credentialsHint"
                              rows={4}
                              defaultValue={provider.credentialsHint ?? ""}
                              className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)] outline-none"
                              placeholder="Example: access approved, API key stored outside repo, awaiting sandbox verification"
                            />
                          </label>

                          <button
                            type="submit"
                            className="rounded-full bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white"
                          >
                            Save provider setup
                          </button>
                        </div>
                      </form>

                      <div className="flex flex-col gap-3">
                        <form action={markProviderSync}>
                          <input type="hidden" name="providerKey" value={provider.providerKey} />
                          <button
                            type="submit"
                            className="w-full rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)]"
                          >
                            Run sync now
                          </button>
                        </form>

                        <form action={resetProviderCredential}>
                          <input type="hidden" name="providerKey" value={provider.providerKey} />
                          <button
                            type="submit"
                            className="w-full rounded-full border border-[rgba(190,63,51,0.2)] bg-[rgba(190,63,51,0.08)] px-4 py-2 text-sm font-medium text-[var(--danger)]"
                          >
                            Reset setup
                          </button>
                        </form>
                      </div>
                    </div>
                  )}

                  <div className="rounded-3xl border border-[var(--border)] bg-white p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Recent sync runs</p>
                    <div className="mt-4 space-y-3">
                      {provider.recentRuns.length === 0 ? (
                        <p className="text-sm text-[var(--foreground-muted)]">
                          No sync events recorded yet for {todayLabel}.
                        </p>
                      ) : (
                        provider.recentRuns.slice(0, 4).map((run) => (
                          <div
                            key={run.id}
                            className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-[var(--navy)]">
                                  {run.importedCount} imported
                                </p>
                                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                                  {run.createdAt.toLocaleString("de-DE")}
                                </p>
                              </div>
                              <StatusPill tone={runTone[run.status as keyof typeof runTone] ?? "info"}>
                                {run.status}
                              </StatusPill>
                            </div>
                            <p className="mt-3 text-sm text-[var(--foreground)]">
                              {run.message ?? "No sync message recorded."}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
