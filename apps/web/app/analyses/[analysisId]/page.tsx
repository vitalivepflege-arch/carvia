import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@carvia/database";
import { MockVehicleProvider } from "@carvia/providers";
import { Card, MarketRangeChart, MetricBar, StatusPill } from "@carvia/ui";
import {
  buildDealerScoreBreakdown,
  buildRiskFactors,
  deriveDemandScore,
  deriveLiquidityScore,
  deriveRiskScore,
  summarizeMarket
} from "../../../lib/analysis-services";
import { activityTypeLabels } from "../../../lib/activities";
import { contactChannelLabels } from "../../../lib/contacts";
import { createWatchlistActivity } from "../../activities/actions";
import { createWatchlistContact, deleteWatchlistContact } from "../../contacts/actions";
import { addVehicleToWatchlist } from "../../watchlist/actions";
import { requireOnboardedSession } from "../../../lib/auth";

const mockProvider = new MockVehicleProvider();

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

export default async function AnalysisDetailPage({
  params
}: {
  params: Promise<{ analysisId: string }>;
}) {
  const { analysisId } = await params;
  const session = await requireOnboardedSession();

  const analysis = await prisma.vehicleAnalysis.findFirst({
    where: {
      id: analysisId,
      companyId: session.user.companyId!
    }
  });

  if (!analysis?.vehicleId) {
    notFound();
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: analysis.vehicleId }
  });

  if (!vehicle) {
    notFound();
  }

  const watchlistItem = await prisma.watchlist.findUnique({
    where: {
      companyId_vehicleId: {
        companyId: session.user.companyId!,
        vehicleId: vehicle.id
      }
    }
  });

  const watchlistActivities = watchlistItem
    ? await prisma.watchlistActivity.findMany({
        where: {
          companyId: session.user.companyId!,
          watchlistId: watchlistItem.id
        },
        orderBy: [{ happenedAt: "desc" }, { createdAt: "desc" }],
        take: 5
      })
    : [];
  const watchlistContacts = watchlistItem
    ? await prisma.watchlistContact.findMany({
        where: {
          companyId: session.user.companyId!,
          watchlistId: watchlistItem.id
        },
        orderBy: [{ lastContactedAt: "desc" }, { createdAt: "desc" }],
        take: 5
      })
    : [];

  const comparables = await mockProvider.getPriceData({
    id: vehicle.id,
    provider: vehicle.provider,
    providerVehicleId: vehicle.providerVehicleId,
    vin: null,
    make: vehicle.make,
    model: vehicle.model,
    modelGroup: vehicle.model,
    generation: null,
    variant: null,
    trim: null,
    vehicleType: "Car",
    bodyType: null,
    firstRegistration: vehicle.firstRegistration ? vehicle.firstRegistration.toISOString().slice(0, 7) : null,
    mileageKm: vehicle.mileageKm,
    fuelType: vehicle.fuelType,
    powerKw: null,
    powerHp: vehicle.powerHp,
    engineCapacityCc: null,
    transmission: vehicle.transmission,
    driveType: vehicle.driveType,
    doors: null,
    seats: null,
    exteriorColor: null,
    interiorColor: null,
    condition: "Used",
    accidentFree: true,
    owners: null,
    inspectionValidUntil: null,
    country: vehicle.country,
    postalCode: vehicle.postalCode,
    latitude: null,
    longitude: null,
    priceGross: Number(analysis.purchasePrice),
    priceNet: null,
    vatType: "GROSS",
    sellerType: "DEALER",
    sellerId: null,
    equipment: [],
    images: [],
    listingUrl: null,
    firstSeenAt: vehicle.firstSeenAt?.toISOString() ?? null,
    lastSeenAt: vehicle.lastSeenAt?.toISOString() ?? null,
    removedAt: vehicle.removedAt?.toISOString() ?? null,
    createdAt: vehicle.createdAt.toISOString(),
    updatedAt: vehicle.updatedAt.toISOString()
  });

  const marketSummary = summarizeMarket(comparables);
  const projectedMargin = Number(analysis.projectedMargin ?? 0);
  const totalLandedCost = Number(analysis.totalLandedCost ?? 0);
  const projectedMarginPercent =
    totalLandedCost > 0 ? Math.round((projectedMargin / totalLandedCost) * 1000) / 10 : 0;
  const demandScore = deriveDemandScore({
    fuelType: vehicle.fuelType,
    make: vehicle.make,
    mileageKm: vehicle.mileageKm,
    model: vehicle.model
  });
  const liquidityScore = deriveLiquidityScore({
    firstRegistration: vehicle.firstRegistration ? vehicle.firstRegistration.toISOString().slice(0, 7) : null,
    mileageKm: vehicle.mileageKm
  });
  const marketPosition = Number(analysis.estimatedTransactionPrice ?? 0) > Number(analysis.purchasePrice) ? 72 : 48;
  const riskScore = deriveRiskScore({
    comparablesCount: comparables.length,
    marginPercent: projectedMarginPercent,
    mileageKm: vehicle.mileageKm
  });
  const scoreBreakdown = buildDealerScoreBreakdown({
    confidence: analysis.confidence ?? 0,
    demand: demandScore,
    liquidity: liquidityScore,
    marginPercent: projectedMarginPercent,
    marketPosition,
    risk: riskScore
  });
  const riskFactors = buildRiskFactors({
    comparablesCount: comparables.length,
    confidence: analysis.confidence ?? 0,
    liquidityScore,
    marginPercent: projectedMarginPercent,
    mileageKm: vehicle.mileageKm
  });

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#faf8f3_0%,#eff0eb_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Saved Analysis</p>
            <h1 className="mt-2 text-4xl font-semibold text-[var(--navy)]">
              {vehicle.make} {vehicle.model}
            </h1>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">
              Created on {analysis.createdAt.toLocaleDateString("en-US", { dateStyle: "long" })} in the current tenant context.
            </p>
          </div>
          <div className="flex gap-3">
            <StatusPill tone="success">DealerScore {analysis.dealerScore ?? "-"}</StatusPill>
            <Link
              href="/analyses"
              className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)]"
            >
              All analyses
            </Link>
            <Link
              href="/deal-check"
              className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)]"
            >
              New Deal Check
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Purchase Price", value: `EUR ${Number(analysis.purchasePrice).toLocaleString("en-US")}` },
            { label: "Total Landed Cost", value: `EUR ${Number(analysis.totalLandedCost ?? 0).toLocaleString("en-US")}` },
            { label: "Estimated Transaction", value: `EUR ${Number(analysis.estimatedTransactionPrice ?? 0).toLocaleString("en-US")}` },
            { label: "Projected Margin", value: `EUR ${Number(analysis.projectedMargin ?? 0).toLocaleString("en-US")}` }
          ].map((item) => (
            <Card key={item.label} title={item.label}>
              <p className="mt-4 text-3xl font-semibold text-[var(--navy)]">{item.value}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <Card title="Vehicle Snapshot">
            <div className="mt-5 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["First Registration", vehicle.firstRegistration?.toISOString().slice(0, 7) ?? "-"],
                  ["Mileage", vehicle.mileageKm ? `${vehicle.mileageKm.toLocaleString("en-US")} km` : "-"],
                  ["Fuel", vehicle.fuelType ?? "-"],
                  ["Transmission", vehicle.transmission ?? "-"],
                  ["Power", vehicle.powerHp ? `${vehicle.powerHp} PS` : "-"],
                  ["Confidence", analysis.confidence ? `${analysis.confidence}%` : "-"]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-3xl bg-[var(--surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">{label}</p>
                    <p className="mt-2 text-lg font-medium text-[var(--navy)]">{value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-3xl border border-[var(--border)] bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--navy)]">Watchlist status</p>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                      {watchlistItem
                        ? "This vehicle is already tracked by your company."
                        : "Save this vehicle to the watchlist for ongoing sourcing review."}
                    </p>
                  </div>
                  {watchlistItem ? <StatusPill tone="success">Tracked</StatusPill> : null}
                </div>

                {!watchlistItem ? (
                  <form action={addVehicleToWatchlist} className="mt-4 space-y-3">
                    <input type="hidden" name="vehicleId" value={vehicle.id} />
                    <textarea
                      name="note"
                      rows={3}
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--navy)] outline-none"
                      placeholder="Optional note for your buying team"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Add to watchlist
                    </button>
                  </form>
                ) : (
                  <Link
                    href="/watchlist"
                    className="mt-4 inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-medium text-[var(--navy)]"
                  >
                    Open watchlist
                  </Link>
                )}
              </div>

              {watchlistItem ? (
                <div className="rounded-3xl border border-[var(--border)] bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--navy)]">Deal activity</p>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                        Capture seller responses, paperwork updates, and negotiation progress on the same tracked vehicle.
                      </p>
                    </div>
                    <StatusPill tone={watchlistActivities.length > 0 ? "success" : "info"}>{watchlistActivities.length}</StatusPill>
                  </div>

                  <div className="mt-4 space-y-3">
                    {watchlistActivities.length === 0 ? (
                      <p className="text-sm text-[var(--foreground-muted)]">No activity logged yet for this tracked vehicle.</p>
                    ) : (
                      watchlistActivities.map((activity) => (
                        <div key={activity.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <StatusPill tone={activityTone[activity.type]}>{activityTypeLabels[activity.type]}</StatusPill>
                          </div>
                          <p className="mt-2 text-sm font-medium text-[var(--navy)]">{activity.summary}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
                            {activity.createdByName ?? "Unknown teammate"} |{" "}
                            {activity.happenedAt.toLocaleDateString("en-US", { dateStyle: "medium" })}
                          </p>
                          {activity.details ? <p className="mt-2 text-sm text-[var(--foreground)]">{activity.details}</p> : null}
                        </div>
                      ))
                    )}
                  </div>

                  <form action={createWatchlistActivity} className="mt-4 space-y-3">
                    <input type="hidden" name="watchlistId" value={watchlistItem.id} />
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
                      placeholder="Seller sent updated maintenance records"
                    />
                    <textarea
                      name="details"
                      rows={3}
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--navy)] outline-none"
                      placeholder="Optional details for the team"
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
                  </form>
                </div>
              ) : null}

              {watchlistItem ? (
                <div className="rounded-3xl border border-[var(--border)] bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--navy)]">Deal contacts</p>
                      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                        Attach seller, broker, or document contacts directly to this tracked analysis.
                      </p>
                    </div>
                    <StatusPill tone={watchlistContacts.length > 0 ? "success" : "info"}>{watchlistContacts.length}</StatusPill>
                  </div>

                  <div className="mt-4 space-y-3">
                    {watchlistContacts.length === 0 ? (
                      <p className="text-sm text-[var(--foreground-muted)]">No contact saved yet for this tracked vehicle.</p>
                    ) : (
                      watchlistContacts.map((contact) => (
                        <div key={contact.id} className="rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
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

                  <form action={createWatchlistContact} className="mt-4 space-y-3">
                    <input type="hidden" name="watchlistId" value={watchlistItem.id} />
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
                      className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3 text-sm text-[var(--navy)] outline-none"
                      placeholder="Optional contact notes"
                    />
                    <button
                      type="submit"
                      className="rounded-full bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Save contact
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          </Card>

          <Card title="Mock Comparables">
            <div className="mt-5 space-y-3">
              {comparables.map((comparable) => (
                <div
                  key={comparable.id}
                  className="grid gap-3 rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4 md:grid-cols-[1.4fr_0.6fr_0.5fr]"
                >
                  <div>
                    <p className="font-medium text-[var(--navy)]">
                      {comparable.make} {comparable.variant ?? comparable.model}
                    </p>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                      {comparable.firstRegistration ?? "-"} | {(comparable.mileageKm ?? 0).toLocaleString("en-US")} km
                    </p>
                  </div>
                  <p className="text-sm font-medium text-[var(--navy)]">
                    EUR {(comparable.priceGross ?? 0).toLocaleString("en-US")}
                  </p>
                  <StatusPill tone="info">Mock</StatusPill>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card title="Market Read">
            <div className="mt-5 space-y-5">
              <MarketRangeChart
                current={Number(analysis.purchasePrice)}
                label="Purchase price versus market band"
                maximum={marketSummary.maximum}
                median={marketSummary.median}
                minimum={marketSummary.minimum}
                percentile25={marketSummary.percentile25}
                percentile75={marketSummary.percentile75}
              />

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {[
                  ["Comparables", String(marketSummary.comparableCount)],
                  ["Market Median", `EUR ${Number(marketSummary.median ?? 0).toLocaleString("en-US")}`],
                  ["Trimmed Mean", `EUR ${Number(marketSummary.trimmedMean ?? 0).toLocaleString("en-US")}`],
                  ["P25", `EUR ${Number(marketSummary.percentile25 ?? 0).toLocaleString("en-US")}`],
                  ["P75", `EUR ${Number(marketSummary.percentile75 ?? 0).toLocaleString("en-US")}`],
                  ["Market Position", `${marketPosition}/100`]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-3xl bg-[var(--surface-muted)] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">{label}</p>
                    <p className="mt-2 text-lg font-medium text-[var(--navy)]">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Score Breakdown">
            <div className="mt-5 space-y-4">
              <div className="rounded-3xl border border-[var(--border)] bg-white p-4">
                <MetricBar
                  label="Overall dealer score"
                  tone={
                    scoreBreakdown.overallScore >= 75
                      ? "success"
                      : scoreBreakdown.overallScore >= 55
                        ? "warning"
                        : "danger"
                  }
                  value={scoreBreakdown.overallScore}
                />
              </div>

              {([
                ["Overall", scoreBreakdown.overallScore],
                ["Margin", scoreBreakdown.marginScore],
                ["Market Price", scoreBreakdown.marketPriceScore],
                ["Demand", scoreBreakdown.demandScore],
                ["Liquidity", scoreBreakdown.liquidityScore],
                ["Risk", scoreBreakdown.riskScore],
                ["Confidence", scoreBreakdown.confidenceScore]
              ] as const).map(([label, value]) => (
                <div key={label} className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                  <MetricBar
                    label={label}
                    tone={Number(value) >= 75 ? "success" : Number(value) >= 55 ? "warning" : "danger"}
                    value={Number(value)}
                  />
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card title="Risk Explainability">
          <div className="mt-5 grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
            <div className="rounded-3xl bg-[var(--surface-muted)] p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">Core Signals</p>
              <div className="mt-4 space-y-3 text-sm text-[var(--foreground)]">
                <p>Projected margin percent: {projectedMarginPercent}%</p>
                <p>Demand score: {demandScore}/100</p>
                <p>Liquidity score: {liquidityScore}/100</p>
                <p>Risk score: {riskScore}/100</p>
              </div>
            </div>

            <div className="grid gap-3">
              {riskFactors.map((factor) => (
                <div
                  key={factor}
                  className="rounded-3xl border border-[var(--border)] bg-white p-4 text-sm text-[var(--foreground)]"
                >
                  {factor}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
