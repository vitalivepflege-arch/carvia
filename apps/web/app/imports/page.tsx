import { Card, StatusPill } from "@carvia/ui";
import { requireOnboardedSession } from "../../lib/auth";
import { getImportRuns, getImportTemplateCsv } from "../../lib/imports";
import { importVehiclesCsv } from "./actions";

function readSearchValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function ImportsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireOnboardedSession();
  const [runs, params] = await Promise.all([
    getImportRuns(session.user.companyId!),
    searchParams
  ]);

  const imported = readSearchValue(params.imported);
  const rows = readSearchValue(params.rows);
  const skipped = readSearchValue(params.skipped);
  const templateCsv = getImportTemplateCsv();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#faf8f3_0%,#eff0eb_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Imports</p>
          <h1 className="mt-2 text-4xl font-semibold text-[var(--navy)]">CSV intake and normalization</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--foreground-muted)]">
            Import external sourcing lists into Carvia with fixed headers, row validation, skip handling, and direct routing into the acquisition watchlist.
          </p>
        </div>

        {rows ? (
          <Card title="Latest Import Result">
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <StatusPill tone="success">Imported {imported || "0"}</StatusPill>
              <StatusPill tone="info">Rows {rows}</StatusPill>
              <StatusPill tone={Number(skipped || "0") > 0 ? "warning" : "success"}>
                Skipped {skipped || "0"}
              </StatusPill>
            </div>
          </Card>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <Card title="Import CSV">
            <form action={importVehiclesCsv} className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--navy)]">Import file name</span>
                <input
                  name="fileName"
                  defaultValue={`dealer-sourcing-${new Date("2026-08-06T00:00:00.000Z").toISOString().slice(0, 10)}.csv`}
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-[var(--navy)]">CSV content</span>
                <textarea
                  name="csvContent"
                  rows={16}
                  defaultValue={templateCsv}
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-mono text-sm text-[var(--navy)] outline-none"
                />
              </label>

              <div className="rounded-3xl bg-[var(--surface-muted)] p-4 text-sm text-[var(--foreground)]">
                Required headers: `providerVehicleId`, `make`, `model`, `variant`, `firstRegistration`, `mileageKm`,
                `fuelType`, `transmission`, `powerHp`, `priceGross`, `postalCode`, `listingUrl`.
              </div>

              <button
                type="submit"
                className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white"
              >
                Run import
              </button>
            </form>
          </Card>

          <Card title="Recent Import Runs">
            <div className="mt-5 space-y-4">
              {runs.length === 0 ? (
                <div className="rounded-3xl bg-[var(--surface-muted)] p-5">
                  <p className="font-medium text-[var(--navy)]">No imports yet</p>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                    The first CSV intake will create a persistent import run and add valid vehicles into your watchlist.
                  </p>
                </div>
              ) : (
                runs.map((run) => (
                  <div key={run.id} className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[var(--navy)]">{run.fileName ?? "Unnamed import"}</p>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                          {run.sourceType.toUpperCase()} | {run.createdAt.toLocaleDateString("en-US", { dateStyle: "long" })}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <StatusPill tone="success">Imported {run.importedCount}</StatusPill>
                        <StatusPill tone="info">Rows {run.rowCount}</StatusPill>
                        <StatusPill tone={run.skippedCount > 0 ? "warning" : "success"}>
                          Skipped {run.skippedCount}
                        </StatusPill>
                      </div>
                    </div>

                    {run.warnings.length > 0 ? (
                      <div className="mt-4 space-y-2">
                        {run.warnings.slice(0, 4).map((warning) => (
                          <div
                            key={warning}
                            className="rounded-2xl border border-[rgba(202,123,25,0.2)] bg-[rgba(202,123,25,0.08)] px-4 py-3 text-sm text-[var(--foreground)]"
                          >
                            {warning}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-[var(--foreground-muted)]">
                        No row warnings were recorded for this import run.
                      </p>
                    )}
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
