import { Card, StatusPill } from "@carvia/ui";
import { requireOnboardedSession } from "../../lib/auth";
import { getProviderOverview } from "../../lib/providers";

const statusTone = {
  CONNECTED: "success",
  DISABLED: "warning",
  ERROR: "danger",
  NOT_CONFIGURED: "info"
} as const;

export default async function ProvidersPage() {
  const session = await requireOnboardedSession();
  const providers = await getProviderOverview(session.user.companyId!);

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

        <div className="grid gap-5 xl:grid-cols-2">
          {providers.map((provider) => (
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
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Policy</p>
                    <p className="mt-2 text-sm font-medium text-[var(--navy)]">
                      {provider.providerKey === "mock" ? "Safe for local MVP testing" : "Manual enablement required"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
