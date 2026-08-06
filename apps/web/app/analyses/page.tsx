import Link from "next/link";
import { Card, StatusPill } from "@carvia/ui";
import { addVehicleToWatchlist } from "../watchlist/actions";
import { requireOnboardedSession } from "../../lib/auth";
import {
  getAnalysisWorkspace,
  readAnalysisFilter,
  readAnalysisScoreBand,
  readAnalysisSort
} from "../../lib/analyses";
import { watchlistStageLabels } from "../../lib/watchlist";

const priorityTone = {
  HIGH: "danger",
  LOW: "info",
  MEDIUM: "warning"
} as const;

function classifyScoreBand(score: number | null) {
  if ((score ?? 0) >= 75) {
    return "high";
  }

  if ((score ?? 0) >= 55) {
    return "medium";
  }

  return "low";
}

export default async function AnalysesPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireOnboardedSession();
  const params = await searchParams;
  const filter = readAnalysisFilter(params.filter);
  const scoreBand = readAnalysisScoreBand(params.scoreBand);
  const sort = readAnalysisSort(params.sort);
  const analyses = await getAnalysisWorkspace(session.user.companyId!);

  const filteredAnalyses = analyses
    .filter((analysis) => {
      if (filter === "tracked") {
        return Boolean(analysis.watchlistItem);
      }

      if (filter === "untracked") {
        return !analysis.watchlistItem;
      }

      return true;
    })
    .filter((analysis) => {
      if (scoreBand === "all") {
        return true;
      }

      return classifyScoreBand(analysis.dealerScore) === scoreBand;
    })
    .sort((left, right) => {
      if (sort === "score") {
        return (right.dealerScore ?? 0) - (left.dealerScore ?? 0);
      }

      if (sort === "margin") {
        return (right.projectedMargin ?? 0) - (left.projectedMargin ?? 0);
      }

      return right.createdAt.getTime() - left.createdAt.getTime();
    });

  const trackedCount = analyses.filter((analysis) => analysis.watchlistItem).length;
  const highConfidenceCount = analyses.filter((analysis) => (analysis.confidence ?? 0) >= 75).length;
  const strongMarginCount = analyses.filter((analysis) => (analysis.projectedMargin ?? 0) >= 3000).length;
  const buyReadyCount = analyses.filter(
    (analysis) => (analysis.dealerScore ?? 0) >= 75 && (analysis.projectedMargin ?? 0) > 0
  ).length;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#faf8f3_0%,#eff0eb_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Analysis Workspace</p>
            <h1 className="mt-2 text-4xl font-semibold text-[var(--navy)]">Saved deal reviews</h1>
            <p className="mt-2 max-w-3xl text-sm text-[var(--foreground-muted)]">
              Review every persisted Deal Check in one tenant-safe workspace, separate high-conviction buys from low-confidence cases, and move strong candidates into your sourcing pipeline.
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
              href="/deal-check"
              className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/10"
            >
              New Deal Check
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Saved Analyses", value: String(analyses.length), delta: "Persisted deal reviews" },
            { label: "Tracked In Pipeline", value: String(trackedCount), delta: "Already on watchlist" },
            { label: "High Confidence", value: String(highConfidenceCount), delta: "Confidence 75% or above" },
            { label: "Buy-Ready Candidates", value: String(buyReadyCount), delta: "Strong score with positive margin" }
          ].map((metric) => (
            <Card key={metric.label} title={metric.label}>
              <p className="mt-4 text-3xl font-semibold text-[var(--navy)]">{metric.value}</p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">{metric.delta}</p>
            </Card>
          ))}
        </div>

        <Card title="Filter saved analyses">
          <form className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Pipeline status</span>
              <select
                name="filter"
                defaultValue={filter}
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              >
                <option value="all">All analyses</option>
                <option value="tracked">Tracked in watchlist</option>
                <option value="untracked">Not tracked yet</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Score band</span>
              <select
                name="scoreBand"
                defaultValue={scoreBand}
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              >
                <option value="all">Any score</option>
                <option value="high">High conviction</option>
                <option value="medium">Watch closely</option>
                <option value="low">Low score</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Sort by</span>
              <select
                name="sort"
                defaultValue={sort}
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              >
                <option value="newest">Newest first</option>
                <option value="score">Dealer score</option>
                <option value="margin">Projected margin</option>
              </select>
            </label>

            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white"
              >
                Apply filters
              </button>
              <Link
                href="/analyses"
                className="rounded-full border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--navy)]"
              >
                Reset
              </Link>
            </div>
          </form>
        </Card>

        {analyses.length === 0 ? (
          <Card title="No saved analyses">
            <div className="mt-5 rounded-3xl bg-[var(--surface-muted)] p-6">
              <p className="text-lg font-medium text-[var(--navy)]">Your analysis workspace is still empty</p>
              <p className="mt-2 max-w-xl text-sm text-[var(--foreground-muted)]">
                Run the first Deal Check to create persisted pricing, margin, confidence, and score snapshots for your buying team.
              </p>
            </div>
          </Card>
        ) : filteredAnalyses.length === 0 ? (
          <Card title="No matching analyses">
            <p className="mt-5 text-sm text-[var(--foreground-muted)]">
              The current filter combination does not match any saved deal reviews. Reset the workspace filter or broaden the score band.
            </p>
          </Card>
        ) : (
          <div className="grid gap-5">
            {filteredAnalyses.map((analysis) => (
              <Card key={analysis.id} title={`${analysis.vehicle.make} ${analysis.vehicle.model}`}>
                <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusPill
                        tone={
                          (analysis.dealerScore ?? 0) >= 75
                            ? "success"
                            : (analysis.dealerScore ?? 0) >= 55
                              ? "warning"
                              : "danger"
                        }
                      >
                        Score {analysis.dealerScore ?? "-"}
                      </StatusPill>
                      <StatusPill tone={(analysis.confidence ?? 0) >= 75 ? "success" : "warning"}>
                        Confidence {analysis.confidence ?? "-"}%
                      </StatusPill>
                      <StatusPill tone="info">
                        Saved {analysis.createdAt.toLocaleDateString("en-US", { dateStyle: "medium" })}
                      </StatusPill>
                      {analysis.watchlistItem ? (
                        <StatusPill tone={priorityTone[analysis.watchlistItem.priority]}>
                          {watchlistStageLabels[analysis.watchlistItem.stage]}
                        </StatusPill>
                      ) : (
                        <StatusPill tone="warning">Not tracked yet</StatusPill>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        ["Purchase Price", `EUR ${analysis.purchasePrice.toLocaleString("en-US")}`],
                        ["Projected Margin", `EUR ${(analysis.projectedMargin ?? 0).toLocaleString("en-US")}`],
                        ["Estimated Transaction", `EUR ${(analysis.estimatedTransactionPrice ?? 0).toLocaleString("en-US")}`],
                        ["Mileage", analysis.vehicle.mileageKm ? `${analysis.vehicle.mileageKm.toLocaleString("en-US")} km` : "-"]
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-3xl bg-[var(--surface-muted)] p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">{label}</p>
                          <p className="mt-2 text-base font-medium text-[var(--navy)]">{value}</p>
                        </div>
                      ))}
                    </div>

                    <p className="text-sm text-[var(--foreground-muted)]">
                      {analysis.vehicle.firstRegistration?.toISOString().slice(0, 7) ?? "Unknown year"} ·{" "}
                      {analysis.vehicle.fuelType ?? "Fuel open"} · {analysis.vehicle.transmission ?? "Transmission open"} ·{" "}
                      {analysis.vehicle.country ?? "EU stock"}
                    </p>
                  </div>

                  <div className="space-y-4 rounded-3xl bg-[var(--surface-muted)] p-4">
                    <div>
                      <p className="text-sm font-medium text-[var(--navy)]">Team next step</p>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                        {analysis.watchlistItem
                          ? analysis.watchlistItem.nextActionAt
                            ? `Next action scheduled for ${analysis.watchlistItem.nextActionAt.toLocaleDateString("en-US", { dateStyle: "long" })}.`
                            : "Already in the pipeline, but still missing a scheduled next action."
                          : "This analysis is not yet connected to the shared sourcing workflow."}
                      </p>
                    </div>

                    {analysis.watchlistItem ? (
                      <div className="flex flex-wrap gap-3">
                        <Link
                          href="/pipeline"
                          className="rounded-full bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white"
                        >
                          Open pipeline
                        </Link>
                        <Link
                          href="/watchlist"
                          className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)]"
                        >
                          Edit watchlist
                        </Link>
                      </div>
                    ) : (
                      <form action={addVehicleToWatchlist} className="space-y-3">
                        <input type="hidden" name="vehicleId" value={analysis.vehicle.id} />
                        <textarea
                          name="note"
                          rows={4}
                          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)] outline-none"
                          placeholder="Why should the team keep this analysis in motion?"
                        />
                        <button
                          type="submit"
                          className="rounded-full bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white"
                        >
                          Add to watchlist
                        </button>
                      </form>
                    )}

                    <Link
                      href={`/analyses/${analysis.id}`}
                      className="inline-flex rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)]"
                    >
                      Open detail view
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Card title="Workspace signal">
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-[var(--surface-muted)] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Conviction coverage</p>
              <p className="mt-3 text-2xl font-semibold text-[var(--navy)]">
                {analyses.length === 0 ? "0%" : `${Math.round((highConfidenceCount / analyses.length) * 100)}%`}
              </p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">Share of analyses with confidence at or above 75%.</p>
            </div>
            <div className="rounded-3xl bg-[var(--surface-muted)] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Margin pool</p>
              <p className="mt-3 text-2xl font-semibold text-[var(--navy)]">{strongMarginCount}</p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">Analyses with projected margin of at least EUR 3,000.</p>
            </div>
            <div className="rounded-3xl bg-[var(--surface-muted)] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Pipeline gap</p>
              <p className="mt-3 text-2xl font-semibold text-[var(--navy)]">{analyses.length - trackedCount}</p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">Saved analyses not yet routed into the ongoing acquisition workflow.</p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
