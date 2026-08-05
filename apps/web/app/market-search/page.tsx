import { Card, StatusPill } from "@carvia/ui";
import { MockVehicleProvider } from "@carvia/providers";
import { requireOnboardedSession } from "../../lib/auth";
import { saveMarketVehicleToWatchlist } from "./actions";

const mockVehicleProvider = new MockVehicleProvider();

function readSearchValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function MarketSearchPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireOnboardedSession();

  const params = await searchParams;
  const make = readSearchValue(params.make);
  const model = readSearchValue(params.model);
  const fuelType = readSearchValue(params.fuelType);
  const transmission = readSearchValue(params.transmission);
  const purchasePriceMaxValue = readSearchValue(params.purchasePriceMax);

  const inventory = await mockVehicleProvider.searchVehicles({
    fuelType: fuelType || undefined,
    make: make || undefined,
    model: model || undefined,
    purchasePriceMax: purchasePriceMaxValue ? Number(purchasePriceMaxValue) : undefined,
    transmission: transmission || undefined
  });

  const taxonomy = await mockVehicleProvider.getTaxonomy();
  const makes = Object.keys(taxonomy);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#faf8f3_0%,#eff0eb_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Market Search</p>
          <h1 className="mt-2 text-4xl font-semibold text-[var(--navy)]">Opportunity scan</h1>
          <p className="mt-2 max-w-3xl text-sm text-[var(--foreground-muted)]">
            Browse mock market inventory through the same provider boundary that later hosts real feeds. Search is intentionally mock-first, but already organized around dealer sourcing workflows.
          </p>
        </div>

        <Card title="Filter inventory">
          <form className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Make</span>
              <select name="make" defaultValue={make} className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
                <option value="">All makes</option>
                {makes.map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Model</span>
              <input
                name="model"
                defaultValue={model}
                placeholder="3 Series"
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Fuel</span>
              <select name="fuelType" defaultValue={fuelType} className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
                <option value="">Any fuel</option>
                {["Petrol", "Diesel", "Hybrid", "Electric"].map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Transmission</span>
              <select name="transmission" defaultValue={transmission} className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
                <option value="">Any transmission</option>
                {["Automatic", "Manual"].map((entry) => (
                  <option key={entry} value={entry}>
                    {entry}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium">Max purchase price</span>
              <input
                name="purchasePriceMax"
                type="number"
                defaultValue={purchasePriceMaxValue}
                placeholder="45000"
                className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              />
            </label>

            <div className="md:col-span-2 xl:col-span-5">
              <button
                type="submit"
                className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white"
              >
                Search inventory
              </button>
            </div>
          </form>
        </Card>

        <div className="grid gap-5">
          {inventory.length === 0 ? (
            <Card title="No matching inventory">
              <p className="mt-5 text-sm text-[var(--foreground-muted)]">
                No mock vehicles match the current filters. Broaden the search to inspect more sourcing candidates.
              </p>
            </Card>
          ) : (
            inventory.map((vehicle) => (
              <Card key={vehicle.id} title={`${vehicle.make} ${vehicle.variant ?? vehicle.model}`}>
                <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      <StatusPill tone="info">Mock Listing</StatusPill>
                      <StatusPill tone="success">EUR {(vehicle.priceGross ?? 0).toLocaleString("en-US")}</StatusPill>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        ["First Registration", vehicle.firstRegistration ?? "-"],
                        ["Mileage", vehicle.mileageKm ? `${vehicle.mileageKm.toLocaleString("en-US")} km` : "-"],
                        ["Fuel", vehicle.fuelType ?? "-"],
                        ["Transmission", vehicle.transmission ?? "-"]
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-3xl bg-[var(--surface-muted)] p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">{label}</p>
                          <p className="mt-2 text-base font-medium text-[var(--navy)]">{value}</p>
                        </div>
                      ))}
                    </div>

                    <p className="text-sm text-[var(--foreground-muted)]">
                      {vehicle.powerHp ? `${vehicle.powerHp} PS` : "-"} in {vehicle.country ?? "DE"} with source listing routed through the provider contract.
                    </p>
                  </div>

                  <form action={saveMarketVehicleToWatchlist} className="rounded-3xl bg-[var(--surface-muted)] p-4">
                    <input type="hidden" name="provider" value={vehicle.provider} />
                    <input type="hidden" name="providerVehicleId" value={vehicle.providerVehicleId ?? vehicle.id} />
                    <input type="hidden" name="make" value={vehicle.make} />
                    <input type="hidden" name="model" value={vehicle.model} />
                    <input type="hidden" name="firstRegistration" value={vehicle.firstRegistration ?? ""} />
                    <input type="hidden" name="mileageKm" value={vehicle.mileageKm ?? ""} />
                    <input type="hidden" name="fuelType" value={vehicle.fuelType ?? ""} />
                    <input type="hidden" name="powerHp" value={vehicle.powerHp ?? ""} />
                    <input type="hidden" name="priceGross" value={vehicle.priceGross ?? ""} />
                    <input type="hidden" name="postalCode" value={vehicle.postalCode ?? ""} />
                    <input type="hidden" name="transmission" value={vehicle.transmission ?? ""} />
                    <input type="hidden" name="listingUrl" value={vehicle.listingUrl ?? ""} />

                    <p className="text-sm font-medium text-[var(--navy)]">Add to watchlist</p>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                      Save this sourcing candidate into your tenant workspace and add a quick buying note.
                    </p>
                    <textarea
                      name="note"
                      rows={4}
                      className="mt-4 w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--navy)] outline-none"
                      placeholder="Example: strong spec, verify service history"
                    />
                    <button
                      type="submit"
                      className="mt-4 rounded-full bg-[var(--navy)] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Save candidate
                    </button>
                  </form>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
