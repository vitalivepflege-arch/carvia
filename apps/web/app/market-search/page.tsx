import Link from "next/link";
import { Card, StatusPill } from "@carvia/ui";
import { MockVehicleProvider } from "@carvia/providers";
import { requireOnboardedSession } from "../../lib/auth";
import { getSavedSearches } from "../../lib/market-search";
import { saveMarketVehicleToWatchlist } from "./actions";
import { createSavedSearch, deleteSavedSearch, toggleSavedSearchAlert } from "./saved-search-actions";

const mockVehicleProvider = new MockVehicleProvider();

function readSearchValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function MarketSearchPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireOnboardedSession();

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
  const savedSearches = await getSavedSearches(session.user.companyId!);

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
              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="rounded-full bg-[var(--navy)] px-5 py-3 text-sm font-semibold text-white"
                >
                  Search inventory
                </button>
              </div>
            </div>
          </form>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <Card title="Save current search">
            <form action={createSavedSearch} className="mt-5 space-y-4">
              <input type="hidden" name="make" value={make} />
              <input type="hidden" name="model" value={model} />
              <input type="hidden" name="fuelType" value={fuelType} />
              <input type="hidden" name="transmission" value={transmission} />
              <input type="hidden" name="purchasePriceMax" value={purchasePriceMaxValue} />
              <input type="hidden" name="resultCount" value={inventory.length} />

              <label className="block">
                <span className="mb-2 block text-sm font-medium">Search name</span>
                <input
                  name="name"
                  defaultValue={
                    make || model ? `${make || "Any make"} ${model || "opportunities"}` : "Open opportunity scan"
                  }
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                />
              </label>

              <label className="flex items-center gap-3 text-sm text-[var(--navy)]">
                <input name="alertEnabled" type="checkbox" className="h-4 w-4 rounded border-[var(--border)]" />
                Enable alert flag for this saved search
              </label>

              <p className="text-sm text-[var(--foreground-muted)]">
                This stores the active filters in your tenant workspace so buyers can rerun the same sourcing window later.
              </p>

              <button
                type="submit"
                className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--navy)]"
              >
                Save search profile
              </button>
            </form>
          </Card>

          <Card title="Saved searches">
            <div className="mt-5 space-y-4">
              {savedSearches.length === 0 ? (
                <div className="rounded-3xl bg-[var(--surface-muted)] p-5">
                  <p className="font-medium text-[var(--navy)]">No saved searches yet</p>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                    Save a filter profile to prepare repeatable sourcing scans and future alerting.
                  </p>
                </div>
              ) : (
                savedSearches.map((search) => (
                  <div key={search.id} className="rounded-3xl border border-[var(--border)] bg-[var(--surface-muted)] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-[var(--navy)]">{search.name}</p>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                          {[
                            search.filters.make || "Any make",
                            search.filters.model || "Any model",
                            search.filters.fuelType || "Any fuel",
                            search.filters.transmission || "Any transmission",
                            search.filters.purchasePriceMax
                              ? `Max EUR ${Number(search.filters.purchasePriceMax).toLocaleString("en-US")}`
                              : "No price cap"
                          ].join(" | ")}
                        </p>
                      </div>
                      <StatusPill tone={search.alertEnabled ? "success" : "info"}>
                        {search.alertEnabled ? "Alert ready" : "Stored only"}
                      </StatusPill>
                    </div>

                    <p className="mt-3 text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
                      Saved on {search.createdAt.toLocaleDateString("en-US", { dateStyle: "medium" })}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={`/market-search?make=${encodeURIComponent(search.filters.make)}&model=${encodeURIComponent(search.filters.model)}&fuelType=${encodeURIComponent(search.filters.fuelType)}&transmission=${encodeURIComponent(search.filters.transmission)}&purchasePriceMax=${encodeURIComponent(search.filters.purchasePriceMax)}`}
                        className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)]"
                      >
                        Reopen filters
                      </Link>

                      <form action={toggleSavedSearchAlert}>
                        <input type="hidden" name="savedSearchId" value={search.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--navy)]"
                        >
                          {search.alertEnabled ? "Disable alert" : "Enable alert"}
                        </button>
                      </form>

                      <form action={deleteSavedSearch}>
                        <input type="hidden" name="savedSearchId" value={search.id} />
                        <button
                          type="submit"
                          className="rounded-full border border-[rgba(190,63,51,0.2)] bg-[rgba(190,63,51,0.08)] px-4 py-2 text-sm font-medium text-[var(--danger)]"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

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
