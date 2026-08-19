"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  HiArrowLeft,
  HiArrowPath,
  HiCheck,
  HiHeart,
  HiMagnifyingGlass,
  HiMapPin,
  HiOutlineHeart,
  HiOutlinePhone,
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
    <main className="min-h-screen bg-[#f4f5f7] text-[#1c1b20]">
      <div className="mx-auto max-w-[1480px] px-4 py-5 md:px-8 lg:px-10">
        <header className="mb-5 rounded-[24px] border border-black/6 bg-white px-4 py-4 shadow-[0_14px_40px_rgba(15,23,42,0.05)] md:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="icon-button !bg-[#f3f4f6] !text-[#1c1b20]">
                <HiArrowLeft className="text-[20px]" />
              </Link>
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Carvia Ergebnisse</p>
                <h1 className="text-[30px] font-black tracking-[-0.04em] md:text-[38px]">
                  {formatNumber(filteredVehicles.length)} Angebote
                </h1>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-[#f3f4f6] px-3 py-2 text-sm font-medium text-slate-600">
                Desktop Ansicht
              </span>
              <span className="rounded-full bg-[#fff0e8] px-3 py-2 text-sm font-semibold text-[#ef4a06]">
                separate Ergebnisseite
              </span>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="xl:sticky xl:top-6 xl:self-start">
            <form onSubmit={submitSearch} className="space-y-4">
              <section className="rounded-[26px] border border-black/6 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Filter</p>
                    <h2 className="mt-1 text-[28px] font-black tracking-[-0.04em]">Suche</h2>
                  </div>
                  <button
                    type="button"
                    onClick={resetSearch}
                    className="inline-flex items-center gap-2 rounded-full bg-[#f3f4f6] px-3 py-2 text-sm font-medium text-slate-600"
                  >
                    <HiArrowPath className="text-base" />
                    Reset
                  </button>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold text-slate-700">Suche</span>
                    <div className="flex items-center gap-3 rounded-[18px] border border-black/8 bg-[#f8fafc] px-4 py-3">
                      <HiMagnifyingGlass className="text-lg text-slate-400" />
                      <input
                        value={filters.query}
                        onChange={(event) => updateFilter("query", event.target.value)}
                        placeholder="Marke, Modell, Ort"
                        className="flex-1 bg-transparent outline-none"
                      />
                    </div>
                  </label>

                  <FilterSection title="Marke, Modell, Variante">
                    <div className="space-y-3">
                      <select
                        value={filters.make}
                        onChange={(event) => updateFilter("make", event.target.value)}
                        className="search-input-light"
                      >
                        <option value="">Beliebig</option>
                        {allBrands.map((brand) => (
                          <option key={brand.name} value={brand.name}>
                            {brand.name}
                          </option>
                        ))}
                      </select>

                      <select
                        value={filters.model}
                        onChange={(event) => updateFilter("model", event.target.value)}
                        className="search-input-light"
                      >
                        <option value="">Beliebig</option>
                        {filteredModels.map((model) => (
                          <option key={model} value={model}>
                            {model}
                          </option>
                        ))}
                      </select>
                    </div>
                  </FilterSection>

                  <FilterSection title="Zahlungsart">
                    <div className="grid grid-cols-2 rounded-[18px] bg-[#f3f4f6] p-1">
                      {(["Kaufen", "Leasen"] as const).map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => updateFilter("paymentMode", mode)}
                          className={`rounded-[14px] px-4 py-3 text-sm font-semibold ${
                            filters.paymentMode === mode ? "bg-white text-[#1c1b20] shadow-sm" : "text-slate-500"
                          }`}
                        >
                          {mode}
                        </button>
                      ))}
                    </div>
                  </FilterSection>

                  <FilterSection title="Preis">
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={filters.minPrice}
                        onChange={(event) => updateFilter("minPrice", event.target.value)}
                        className="search-input-light"
                      >
                        {priceOptions.map((option) => (
                          <option key={`min-${option || "all"}`} value={option}>
                            {option ? `${formatNumber(Number(option))} EUR` : "von"}
                          </option>
                        ))}
                      </select>
                      <select
                        value={filters.maxPrice}
                        onChange={(event) => updateFilter("maxPrice", event.target.value)}
                        className="search-input-light"
                      >
                        {priceOptions.map((option) => (
                          <option key={`max-${option || "all"}`} value={option}>
                            {option ? `${formatNumber(Number(option))} EUR` : "bis"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </FilterSection>

                  <FilterSection title="Erstzulassung / Kilometerstand">
                    <div className="space-y-3">
                      <select
                        value={filters.firstRegistrationFrom}
                        onChange={(event) => updateFilter("firstRegistrationFrom", event.target.value)}
                        className="search-input-light"
                      >
                        {registrationOptions.map((option) => (
                          <option key={option || "reg-all"} value={option}>
                            {option ? `ab ${option}` : "Erstzulassung"}
                          </option>
                        ))}
                      </select>

                      <select
                        value={filters.maxMileage}
                        onChange={(event) => updateFilter("maxMileage", event.target.value)}
                        className="search-input-light"
                      >
                        {mileageOptions.map((option) => (
                          <option key={option || "km-all"} value={option}>
                            {option ? `bis ${formatNumber(Number(option))} km` : "Kilometerstand"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </FilterSection>

                  <FilterSection title="Standort / Antrieb">
                    <div className="space-y-3">
                      <input
                        value={filters.postalCode}
                        onChange={(event) => updateFilter("postalCode", event.target.value)}
                        placeholder="Ort oder PLZ"
                        className="search-input-light"
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <select
                          value={filters.fuelType}
                          onChange={(event) => updateFilter("fuelType", event.target.value as SearchFilters["fuelType"])}
                          className="search-input-light"
                        >
                          {fuelOptions.map((option) => (
                            <option key={option || "fuel-all"} value={option}>
                              {option || "Kraftstoff"}
                            </option>
                          ))}
                        </select>

                        <select
                          value={filters.transmission}
                          onChange={(event) =>
                            updateFilter("transmission", event.target.value as SearchFilters["transmission"])
                          }
                          className="search-input-light"
                        >
                          {transmissionOptions.map((option) => (
                            <option key={option || "gear-all"} value={option}>
                              {option || "Getriebe"}
                            </option>
                          ))}
                        </select>
                      </div>

                      <label className="flex items-center gap-3 rounded-[18px] border border-black/6 bg-[#f8fafc] px-4 py-3">
                        <span className={`checkbox ${filters.electricOnly ? "checkbox-active" : ""}`}>
                          {filters.electricOnly ? <HiCheck className="text-sm" /> : null}
                        </span>
                        <input
                          type="checkbox"
                          checked={filters.electricOnly}
                          onChange={(event) => updateFilter("electricOnly", event.target.checked)}
                          className="sr-only"
                        />
                        <span className="font-semibold text-slate-700">Nur Elektroautos</span>
                      </label>
                    </div>
                  </FilterSection>
                </div>

                <button type="submit" className="mt-5 w-full rounded-[18px] bg-[#ef4a06] px-5 py-4 text-base font-bold text-white">
                  {formatNumber(filteredVehicles.length)} Fahrzeuge anzeigen
                </button>
              </section>
            </form>
          </aside>

          <section className="space-y-4">
            <div className="rounded-[24px] border border-black/6 bg-white px-4 py-4 shadow-[0_14px_40px_rgba(15,23,42,0.05)] md:px-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.16em] text-slate-500">Ergebnisse</p>
                  <p className="mt-1 text-[30px] font-black tracking-[-0.04em]">{formatNumber(filteredVehicles.length)} Angebote</p>
                </div>

                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <input
                    value={filters.query}
                    onChange={(event) => updateFilter("query", event.target.value)}
                    placeholder="Suchbegriff anpassen"
                    className="search-input-light min-w-[260px]"
                  />
                  <select className="search-input-light min-w-[220px]" defaultValue="relevance">
                    <option value="relevance">Sortieren nach Relevanz</option>
                    <option value="price_asc">Preis aufsteigend</option>
                    <option value="price_desc">Preis absteigend</option>
                    <option value="mileage_asc">Kilometer aufsteigend</option>
                  </select>
                </div>
              </div>
            </div>

            {filteredVehicles.length === 0 ? (
              <div className="rounded-[30px] border border-dashed border-black/12 bg-white px-8 py-12 text-center">
                <p className="text-[28px] font-black tracking-[-0.04em]">Keine Fahrzeuge gefunden</p>
                <p className="mt-2 text-slate-500">Passe die Filter an oder starte die Suche neu.</p>
              </div>
            ) : (
              filteredVehicles.map((vehicle, index) => (
                <button
                  key={vehicle.id}
                  type="button"
                  onClick={() => setSelectedVehicle(vehicle)}
                  className="w-full rounded-[28px] border border-black/6 bg-white p-4 text-left shadow-[0_14px_40px_rgba(15,23,42,0.05)] transition hover:border-black/12"
                >
                  <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                    <div className="overflow-hidden rounded-[22px] bg-[#eef2f6]">
                      <Image
                        src={vehicle.image}
                        alt={`${vehicle.make} ${vehicle.variant}`}
                        width={640}
                        height={420}
                        className="h-[240px] w-full object-cover"
                      />
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="mb-2 flex items-center gap-2">
                            {index === 0 ? (
                              <span className="rounded-full bg-[#fff0e8] px-2.5 py-1 text-xs font-semibold text-[#ef4a06]">
                                Top
                              </span>
                            ) : null}
                            <span className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-xs font-semibold text-[#2152d6]">
                              {vehicle.source === "carvia" ? "Carvia Inserat" : "Markt"}
                            </span>
                          </div>

                          <p className="text-[30px] font-black leading-[1.05] tracking-[-0.04em]">
                            {vehicle.make} {vehicle.variant}
                          </p>
                          <p className="mt-1 text-base text-slate-500">
                            {vehicle.model} / {vehicle.bodyType}
                          </p>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="text-right">
                            <p className="text-[36px] font-black leading-none tracking-[-0.05em]">
                              {formatCurrency(vehicle.priceGross)}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[#17924e]">{vehicle.priceRating}</p>
                          </div>
                          <button
                            type="button"
                            className="mini-action-button !border-black/8 !text-slate-600"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleFavorite(vehicle.id);
                            }}
                          >
                            {favoriteIds.includes(vehicle.id) ? (
                              <HiHeart className="text-[18px] text-[#ef4a06]" />
                            ) : (
                              <HiOutlineHeart className="text-[18px]" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {vehicle.features.map((feature) => (
                          <span key={feature} className="rounded-full bg-[#f6f7f9] px-3 py-1.5 text-sm text-slate-700">
                            {feature}
                          </span>
                        ))}
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

                      <div className="grid gap-4 rounded-[22px] bg-[#f8fafc] p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                        <div className="flex items-center gap-3">
                          <Image
                            src={getBrandLogo(vehicle.make)}
                            alt={vehicle.make}
                            width={48}
                            height={48}
                            className="h-12 w-12 rounded-full bg-white object-contain p-2 shadow-sm"
                          />
                          <div>
                            <p className="font-semibold">{vehicle.dealerName}</p>
                            <p className="text-sm text-slate-500">
                              {vehicle.dealerCity} / EZ {formatMonthYear(vehicle.firstRegistration)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button type="button" className="mini-action-button !border-black/8 !text-slate-600">
                            <HiOutlinePhone className="text-[18px]" />
                          </button>
                          <span className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-[#ef4a06] shadow-sm">
                            Details ansehen
                          </span>
                        </div>
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
        <div className="fixed inset-0 z-40 bg-black/50 p-4 backdrop-blur-sm">
          <div className="mx-auto mt-4 max-w-[1040px] rounded-[32px] bg-white p-5 text-[#1c1b20] shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Fahrzeugdetail</p>
                <h2 className="text-[34px] font-black tracking-[-0.04em]">
                  {selectedVehicle.make} {selectedVehicle.model}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVehicle(null)}
                className="icon-button !bg-[#f3f4f6] !text-[#1c1b20]"
              >
                <HiArrowLeft className="text-[20px]" />
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <Image
                src={selectedVehicle.image}
                alt={`${selectedVehicle.make} ${selectedVehicle.variant}`}
                width={920}
                height={620}
                className="h-[360px] w-full rounded-[28px] object-cover"
              />

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Image
                    src={getBrandLogo(selectedVehicle.make)}
                    alt={selectedVehicle.make}
                    width={52}
                    height={52}
                    className="h-13 w-13 rounded-full bg-[#f4f5f7] object-contain p-2"
                  />
                  <div>
                    <p className="text-[18px] text-slate-500">{selectedVehicle.variant}</p>
                    <p className="text-[40px] font-black tracking-[-0.05em]">
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

                <div className="rounded-[24px] bg-[#f8fafc] p-4">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Haendler</p>
                  <p className="mt-2 text-xl font-bold">{selectedVehicle.dealerName}</p>
                  <p className="text-sm text-slate-500">{selectedVehicle.dealerCity}</p>
                </div>

                <div className="rounded-[24px] bg-[#f8fafc] p-4">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Beschreibung</p>
                  <p className="mt-2 leading-7 text-slate-700">{selectedVehicle.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function FilterSection({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  return (
    <section className="rounded-[22px] border border-black/6 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-slate-700">{title}</p>
      {children}
    </section>
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
    <div className="rounded-[18px] bg-white p-4 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)]">
      <Icon className="text-[22px] text-[#ef4a06]" />
      <p className="mt-3 text-sm text-slate-500">{label}</p>
      <p className="mt-1 font-semibold text-slate-800">{value}</p>
    </div>
  );
}
