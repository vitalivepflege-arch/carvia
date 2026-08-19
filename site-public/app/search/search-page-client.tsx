"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HiArrowLeft,
  HiCheck,
  HiHeart,
  HiMagnifyingGlass,
  HiMapPin,
  HiOutlineHeart,
} from "react-icons/hi2";
import { PiGasCan, PiGauge, PiGearSix } from "react-icons/pi";
import { TbManualGearbox } from "react-icons/tb";
import {
  allBrands,
  buildSearchHref,
  demoVehicles,
  emptySearchFilters,
  filterVehicles,
  formatCurrency,
  formatMonthYear,
  formatNumber,
  fuelOptions,
  getBrandLogo,
  makeModelMap,
  mileageOptions,
  priceOptions,
  registrationOptions,
  storageKey,
  transmissionOptions,
  type SearchFilters,
  type VehicleRecord,
} from "@/lib/carvia-market";

export function SearchPageClient({ initialFilters }: { initialFilters: SearchFilters }) {
  const router = useRouter();
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRecord | null>(null);
  const [localListings] = useState<VehicleRecord[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as VehicleRecord[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const allVehicles = useMemo(() => [...localListings, ...demoVehicles], [localListings]);
  const filteredModels = useMemo(
    () => (filters.make && makeModelMap[filters.make] ? makeModelMap[filters.make] : []),
    [filters.make],
  );
  const filteredVehicles = useMemo(() => filterVehicles(allVehicles, filters), [allVehicles, filters]);

  function updateFilter<Key extends keyof SearchFilters>(key: Key, value: SearchFilters[Key]) {
    setFilters((current) => {
      const next = { ...current, [key]: value };

      if (key === "make") {
        const nextMake = value as string;
        const availableModels = nextMake ? makeModelMap[nextMake] ?? [] : [];

        if (!nextMake || (next.model && !availableModels.includes(next.model))) {
          next.model = "";
        }
      }

      return next;
    });
  }

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(buildSearchHref(filters));
  }

  function resetSearch() {
    setFilters(emptySearchFilters);
    router.push("/search");
  }

  function toggleFavorite(vehicleId: string) {
    setFavoriteIds((current) =>
      current.includes(vehicleId) ? current.filter((entry) => entry !== vehicleId) : [vehicleId, ...current],
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-white">
      <div className="mx-auto max-w-[1480px] px-4 py-6 md:px-8 lg:px-10">
        <div className="mb-6 flex items-center justify-between rounded-[28px] border border-white/8 bg-[var(--surface)] px-4 py-4 md:px-6">
          <div className="flex items-center gap-4">
            <Link href="/" className="icon-button">
              <HiArrowLeft className="text-[20px]" />
            </Link>
            <div>
              <p className="text-sm uppercase tracking-[0.22em] text-[var(--foreground-muted)]">Carvia Search</p>
              <h1 className="text-[28px] font-black tracking-[-0.04em] md:text-[36px]">
                {formatNumber(filteredVehicles.length)} Fahrzeuge
              </h1>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <span className="rounded-full border border-white/10 px-3 py-1 text-sm text-[var(--foreground-muted)]">
              {allBrands.length} Marken mit Logo
            </span>
            <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-sm font-semibold">
              Nur Ergebnisse
            </span>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <form onSubmit={submitSearch} className="rounded-[30px] border border-white/8 bg-[var(--surface)] p-5">
              <p className="text-sm uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Filter</p>
              <h2 className="mt-2 text-[28px] font-black tracking-[-0.04em]">Suche verfeinern</h2>

              <div className="mt-5 space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Freitext</span>
                  <div className="search-field bg-[var(--surface-soft)]">
                    <HiMagnifyingGlass className="text-lg text-white/60" />
                    <input
                      value={filters.query}
                      onChange={(event) => updateFilter("query", event.target.value)}
                      placeholder="Marke, Modell oder Ort"
                      className="flex-1 bg-transparent outline-none"
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Marke</span>
                  <select
                    value={filters.make}
                    onChange={(event) => updateFilter("make", event.target.value)}
                    className="form-input"
                  >
                    <option value="">Beliebig</option>
                    {allBrands.map((brand) => (
                      <option key={brand.name} value={brand.name}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold">Modell</span>
                  <select
                    value={filters.model}
                    onChange={(event) => updateFilter("model", event.target.value)}
                    className="form-input"
                  >
                    <option value="">Beliebig</option>
                    {filteredModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Preis bis</span>
                    <select
                      value={filters.maxPrice}
                      onChange={(event) => updateFilter("maxPrice", event.target.value)}
                      className="form-input"
                    >
                      {priceOptions.map((option) => (
                        <option key={option || "all"} value={option}>
                          {option ? `${formatNumber(Number(option))} EUR` : "Beliebig"}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Kilometer bis</span>
                    <select
                      value={filters.maxMileage}
                      onChange={(event) => updateFilter("maxMileage", event.target.value)}
                      className="form-input"
                    >
                      {mileageOptions.map((option) => (
                        <option key={option || "all"} value={option}>
                          {option ? `${formatNumber(Number(option))} km` : "Beliebig"}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Erstzulassung ab</span>
                    <select
                      value={filters.firstRegistrationFrom}
                      onChange={(event) => updateFilter("firstRegistrationFrom", event.target.value)}
                      className="form-input"
                    >
                      {registrationOptions.map((option) => (
                        <option key={option || "all"} value={option}>
                          {option || "Beliebig"}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Ort oder PLZ</span>
                    <input
                      value={filters.postalCode}
                      onChange={(event) => updateFilter("postalCode", event.target.value)}
                      placeholder="50667"
                      className="form-input"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Kraftstoff</span>
                    <select
                      value={filters.fuelType}
                      onChange={(event) => updateFilter("fuelType", event.target.value as SearchFilters["fuelType"])}
                      className="form-input"
                    >
                      {fuelOptions.map((option) => (
                        <option key={option || "all"} value={option}>
                          {option || "Beliebig"}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold">Getriebe</span>
                    <select
                      value={filters.transmission}
                      onChange={(event) =>
                        updateFilter("transmission", event.target.value as SearchFilters["transmission"])
                      }
                      className="form-input"
                    >
                      {transmissionOptions.map((option) => (
                        <option key={option || "all"} value={option}>
                          {option || "Beliebig"}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="flex items-center gap-3 rounded-[18px] border border-white/8 bg-[var(--surface-soft)] px-4 py-4">
                  <span className={`checkbox ${filters.electricOnly ? "checkbox-active" : ""}`}>
                    {filters.electricOnly ? <HiCheck className="text-sm" /> : null}
                  </span>
                  <input
                    type="checkbox"
                    checked={filters.electricOnly}
                    onChange={(event) => updateFilter("electricOnly", event.target.checked)}
                    className="sr-only"
                  />
                  <span className="font-semibold">Nur Elektroautos</span>
                </label>
              </div>

              <div className="mt-5 flex gap-3">
                <button type="submit" className="contact-button flex-1">
                  <HiMagnifyingGlass className="text-[20px]" />
                  Suchen
                </button>
                <button
                  type="button"
                  onClick={resetSearch}
                  className="rounded-[18px] border border-white/10 px-4 py-3 font-semibold text-white/80"
                >
                  Reset
                </button>
              </div>
            </form>
          </aside>

          <section className="space-y-4">
            {filteredVehicles.length === 0 ? (
              <div className="rounded-[30px] border border-dashed border-white/12 bg-[var(--surface)] px-8 py-12 text-center">
                <p className="text-[28px] font-black tracking-[-0.04em]">Keine Fahrzeuge gefunden</p>
                <p className="mt-2 text-[var(--foreground-muted)]">
                  Passe die Filter an oder gehe zur Startseite zurueck.
                </p>
              </div>
            ) : (
              filteredVehicles.map((vehicle) => (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => setSelectedVehicle(vehicle)}
                  className="w-full rounded-[30px] border border-white/8 bg-[var(--surface)] p-4 text-left transition hover:border-white/16"
                >
                  <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                    <div className="overflow-hidden rounded-[22px] bg-white/4">
                      <Image
                        src={vehicle.image}
                        alt={`${vehicle.make} ${vehicle.variant}`}
                        width={560}
                        height={360}
                        className="h-[220px] w-full object-cover"
                      />
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-3">
                            <Image
                              src={getBrandLogo(vehicle.make)}
                              alt={vehicle.make}
                              width={44}
                              height={44}
                              className="h-11 w-11 rounded-full bg-white object-contain p-2"
                            />
                            <div>
                              <p className="text-[28px] font-black tracking-[-0.04em]">
                                {vehicle.make} {vehicle.model}
                              </p>
                              <p className="text-base text-[var(--foreground-muted)]">{vehicle.variant}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-[34px] font-black tracking-[-0.05em]">{formatCurrency(vehicle.priceGross)}</p>
                            <p className="text-sm text-[#83d995]">{vehicle.priceRating}</p>
                          </div>
                          <button
                            type="button"
                            className="mini-action-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleFavorite(vehicle.id);
                            }}
                          >
                            {favoriteIds.includes(vehicle.id) ? (
                              <HiHeart className="text-[18px] text-[var(--accent)]" />
                            ) : (
                              <HiOutlineHeart className="text-[18px]" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-4">
                        <SpecItem icon={PiGauge} label="Kilometer" value={`${formatNumber(vehicle.mileageKm)} km`} />
                        <SpecItem icon={PiGasCan} label="Kraftstoff" value={vehicle.fuelType} />
                        <SpecItem
                          icon={vehicle.transmission === "Automatik" ? PiGearSix : TbManualGearbox}
                          label="Getriebe"
                          value={vehicle.transmission}
                        />
                        <SpecItem icon={HiMapPin} label="Standort" value={vehicle.location} />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {vehicle.features.map((feature) => (
                          <span key={feature} className="rounded-full bg-white/6 px-3 py-1.5 text-sm text-white/84">
                            {feature}
                          </span>
                        ))}
                      </div>

                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold">{vehicle.dealerName}</p>
                          <p className="text-sm text-[var(--foreground-muted)]">
                            {vehicle.dealerCity} / EZ {formatMonthYear(vehicle.firstRegistration)}
                          </p>
                        </div>
                        <span className="text-sm font-semibold text-[var(--accent-soft)]">Details ansehen</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </section>
        </div>
      </div>

      {selectedVehicle ? (
        <div className="fixed inset-0 z-40 bg-black/60 p-4 backdrop-blur-sm">
          <div className="mx-auto mt-4 max-w-[980px] rounded-[32px] border border-white/8 bg-[var(--surface)] p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Fahrzeugdetail</p>
                <h2 className="text-[30px] font-black tracking-[-0.04em]">
                  {selectedVehicle.make} {selectedVehicle.model}
                </h2>
              </div>
              <button type="button" onClick={() => setSelectedVehicle(null)} className="icon-button">
                <HiArrowLeft className="text-[20px]" />
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <Image
                src={selectedVehicle.image}
                alt={`${selectedVehicle.make} ${selectedVehicle.variant}`}
                width={900}
                height={620}
                className="h-[340px] w-full rounded-[26px] object-cover"
              />

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Image
                    src={getBrandLogo(selectedVehicle.make)}
                    alt={selectedVehicle.make}
                    width={48}
                    height={48}
                    className="h-12 w-12 rounded-full bg-white object-contain p-2"
                  />
                  <div>
                    <p className="text-[18px] text-[var(--foreground-muted)]">{selectedVehicle.variant}</p>
                    <p className="text-[36px] font-black tracking-[-0.05em]">
                      {formatCurrency(selectedVehicle.priceGross)}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <SpecItem icon={PiGauge} label="Kilometerstand" value={`${formatNumber(selectedVehicle.mileageKm)} km`} />
                  <SpecItem icon={PiGasCan} label="Kraftstoff" value={selectedVehicle.fuelType} />
                  <SpecItem icon={HiMapPin} label="Standort" value={selectedVehicle.location} />
                  <SpecItem icon={PiGearSix} label="Leistung" value={`${selectedVehicle.powerHp} PS`} />
                </div>

                <div className="rounded-[24px] bg-[var(--surface-soft)] p-4">
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Haendler</p>
                  <p className="mt-2 text-xl font-bold">{selectedVehicle.dealerName}</p>
                  <p className="text-sm text-[var(--foreground-muted)]">{selectedVehicle.dealerCity}</p>
                </div>

                <div className="rounded-[24px] bg-[var(--surface-soft)] p-4">
                  <p className="text-sm uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Beschreibung</p>
                  <p className="mt-2 leading-7 text-white/84">{selectedVehicle.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function SpecItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] bg-[var(--surface-soft)] p-4">
      <Icon className="text-[24px] text-[var(--accent)]" />
      <p className="mt-3 text-sm text-[var(--foreground-muted)]">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
