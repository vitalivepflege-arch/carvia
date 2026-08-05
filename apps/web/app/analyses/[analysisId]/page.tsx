import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@carvia/database";
import { Card, StatusPill } from "@carvia/ui";
import { MockVehicleProvider } from "@carvia/providers";
import { requireOnboardedSession } from "../../../lib/auth";

const mockProvider = new MockVehicleProvider();

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

  if (!analysis || !analysis.vehicleId) {
    notFound();
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: analysis.vehicleId }
  });

  if (!vehicle) {
    notFound();
  }

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
    firstRegistration: vehicle.firstRegistration
      ? vehicle.firstRegistration.toISOString().slice(0, 7)
      : null,
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
              Created on August 5, 2026 in the current tenant context.
            </p>
          </div>
          <div className="flex gap-3">
            <StatusPill tone="success">DealerScore {analysis.dealerScore ?? "-"}</StatusPill>
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
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
                      {comparable.firstRegistration ?? "-"} · {(comparable.mileageKm ?? 0).toLocaleString("en-US")} km
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
      </div>
    </main>
  );
}
