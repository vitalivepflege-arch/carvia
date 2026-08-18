"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type FuelType = "Diesel" | "Electric" | "Hybrid" | "Petrol";
type Transmission = "Automatic" | "Manual";
type BodyType = "Convertible" | "Coupe" | "Hatchback" | "Sedan" | "SUV" | "Wagon";

type VehicleRecord = {
  bodyType: BodyType;
  firstRegistration: string;
  fuelType: FuelType;
  id: string;
  image: string;
  location: string;
  make: string;
  mileageKm: number;
  model: string;
  powerHp: number;
  priceGross: number;
  source: "carvia" | "market";
  transmission: Transmission;
  variant: string;
};

type SearchFilters = {
  fuelType: "" | FuelType;
  make: string;
  maxMileage: string;
  maxPrice: string;
  query: string;
  transmission: "" | Transmission;
};

type ListingFormState = {
  bodyType: BodyType;
  firstRegistration: string;
  fuelType: FuelType;
  location: string;
  make: string;
  mileageKm: string;
  model: string;
  powerHp: string;
  priceGross: string;
  transmission: Transmission;
  variant: string;
};

const vehicleImageByBodyType: Record<BodyType, string> = {
  Convertible: "/assets/vehicle-stock/convertible.svg",
  Coupe: "/assets/vehicle-stock/coupe.svg",
  Hatchback: "/assets/vehicle-stock/hatchback.svg",
  Sedan: "/assets/vehicle-stock/sedan.svg",
  SUV: "/assets/vehicle-stock/suv.svg",
  Wagon: "/assets/vehicle-stock/wagon.svg",
};

const demoVehicles: VehicleRecord[] = [
  {
    id: "market-bmw-320d",
    make: "BMW",
    model: "3 Series",
    variant: "320d Touring",
    bodyType: "Wagon",
    fuelType: "Diesel",
    transmission: "Automatic",
    firstRegistration: "2022-04",
    mileageKm: 64000,
    powerHp: 190,
    priceGross: 31980,
    location: "Koeln",
    image: "/assets/vehicle-stock/wagon.svg",
    source: "market",
  },
  {
    id: "market-audi-q5",
    make: "Audi",
    model: "Q5",
    variant: "50 TFSI e quattro",
    bodyType: "SUV",
    fuelType: "Hybrid",
    transmission: "Automatic",
    firstRegistration: "2023-04",
    mileageKm: 37000,
    powerHp: 299,
    priceGross: 45980,
    location: "Leipzig",
    image: "/assets/vehicle-stock/suv.svg",
    source: "market",
  },
  {
    id: "market-mercedes-c220",
    make: "Mercedes-Benz",
    model: "C-Class",
    variant: "C 220 d T",
    bodyType: "Wagon",
    fuelType: "Diesel",
    transmission: "Automatic",
    firstRegistration: "2022-07",
    mileageKm: 58000,
    powerHp: 200,
    priceGross: 36490,
    location: "Bremen",
    image: "/assets/vehicle-stock/wagon.svg",
    source: "market",
  },
  {
    id: "market-vw-golf-gti",
    make: "Volkswagen",
    model: "Golf",
    variant: "GTI Clubsport",
    bodyType: "Hatchback",
    fuelType: "Petrol",
    transmission: "Automatic",
    firstRegistration: "2022-06",
    mileageKm: 41000,
    powerHp: 300,
    priceGross: 33200,
    location: "Leipzig",
    image: "/assets/vehicle-stock/hatchback.svg",
    source: "market",
  },
  {
    id: "market-tesla-model-y",
    make: "Tesla",
    model: "Model Y",
    variant: "Performance",
    bodyType: "SUV",
    fuelType: "Electric",
    transmission: "Automatic",
    firstRegistration: "2023-03",
    mileageKm: 24000,
    powerHp: 534,
    priceGross: 46990,
    location: "Dresden",
    image: "/assets/vehicle-stock/suv.svg",
    source: "market",
  },
  {
    id: "market-mazda-mx5",
    make: "Mazda",
    model: "MX-5",
    variant: "Skyactiv-G 184",
    bodyType: "Convertible",
    fuelType: "Petrol",
    transmission: "Manual",
    firstRegistration: "2021-06",
    mileageKm: 36000,
    powerHp: 184,
    priceGross: 26950,
    location: "Koeln",
    image: "/assets/vehicle-stock/convertible.svg",
    source: "market",
  },
];

const emptySearchFilters: SearchFilters = {
  fuelType: "",
  make: "",
  maxMileage: "",
  maxPrice: "",
  query: "",
  transmission: "",
};

const emptyListingForm: ListingFormState = {
  bodyType: "Sedan",
  firstRegistration: "2023-01",
  fuelType: "Petrol",
  location: "Koeln",
  make: "",
  mileageKm: "",
  model: "",
  powerHp: "",
  priceGross: "",
  transmission: "Automatic",
  variant: "",
};

const storageKey = "carvia-site-public-listings";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function makeSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function Home() {
  const [filters, setFilters] = useState<SearchFilters>(emptySearchFilters);
  const [listings, setListings] = useState<VehicleRecord[]>([]);
  const [listingForm, setListingForm] = useState<ListingFormState>(emptyListingForm);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as VehicleRecord[];
      if (Array.isArray(parsed)) {
        setListings(parsed);
      }
    } catch {
      window.localStorage.removeItem(storageKey);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(listings));
  }, [listings]);

  const allVehicles = useMemo(() => [...listings, ...demoVehicles], [listings]);

  const availableMakes = useMemo(
    () => [...new Set(allVehicles.map((vehicle) => vehicle.make))].sort((left, right) => left.localeCompare(right)),
    [allVehicles],
  );

  const filteredVehicles = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLowerCase();
    const normalizedMake = filters.make.trim().toLowerCase();
    const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : null;
    const maxMileage = filters.maxMileage ? Number(filters.maxMileage) : null;

    return allVehicles.filter((vehicle) => {
      if (
        normalizedQuery &&
        !`${vehicle.make} ${vehicle.model} ${vehicle.variant} ${vehicle.location}`.toLowerCase().includes(normalizedQuery)
      ) {
        return false;
      }

      if (normalizedMake && vehicle.make.toLowerCase() !== normalizedMake) {
        return false;
      }

      if (filters.fuelType && vehicle.fuelType !== filters.fuelType) {
        return false;
      }

      if (filters.transmission && vehicle.transmission !== filters.transmission) {
        return false;
      }

      if (maxPrice !== null && vehicle.priceGross > maxPrice) {
        return false;
      }

      if (maxMileage !== null && vehicle.mileageKm > maxMileage) {
        return false;
      }

      return true;
    });
  }, [allVehicles, filters]);

  function updateFilter<Key extends keyof SearchFilters>(key: Key, value: SearchFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function updateListingForm<Key extends keyof ListingFormState>(key: Key, value: ListingFormState[Key]) {
    setListingForm((current) => ({ ...current, [key]: value }));
  }

  function submitListing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !listingForm.make.trim() ||
      !listingForm.model.trim() ||
      !listingForm.variant.trim() ||
      !listingForm.priceGross ||
      !listingForm.mileageKm ||
      !listingForm.powerHp
    ) {
      setSaveMessage("Bitte alle Pflichtfelder fuer das Inserat ausfuellen.");
      return;
    }

    const record: VehicleRecord = {
      id: `carvia-${makeSlug(`${listingForm.make}-${listingForm.model}-${Date.now()}`)}`,
      make: listingForm.make.trim(),
      model: listingForm.model.trim(),
      variant: listingForm.variant.trim(),
      bodyType: listingForm.bodyType,
      fuelType: listingForm.fuelType,
      transmission: listingForm.transmission,
      firstRegistration: listingForm.firstRegistration,
      mileageKm: Number(listingForm.mileageKm),
      powerHp: Number(listingForm.powerHp),
      priceGross: Number(listingForm.priceGross),
      location: listingForm.location.trim() || "Deutschland",
      image: vehicleImageByBodyType[listingForm.bodyType],
      source: "carvia",
    };

    setListings((current) => [record, ...current]);
    setListingForm({
      ...emptyListingForm,
      location: listingForm.location,
    });
    setSaveMessage(`Inserat gespeichert: ${record.make} ${record.variant}`);
  }

  return (
    <main className="min-h-screen bg-[var(--background)] text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-6 md:px-8 md:py-8">
        <header className="overflow-hidden rounded-[36px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(247,119,55,0.24),transparent_30%),linear-gradient(145deg,#121a2a_0%,#0b111d_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.32)]">
          <div className="flex flex-col gap-8 px-6 py-6 lg:px-10 lg:py-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <Image
                  src="/assets/mobile-de/logo-dark-de.webp"
                  alt="Carvia"
                  width={214}
                  height={40}
                  className="h-9 w-auto"
                />
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                  Public v1
                </span>
              </div>

              <nav className="flex flex-wrap gap-2">
                <a href="#suche" className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white">
                  Fahrzeuge suchen
                </a>
                <a
                  href="#inserieren"
                  className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200"
                >
                  Fahrzeug inserieren
                </a>
              </nav>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-xs uppercase tracking-[0.34em] text-orange-200">Carvia</p>
                <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-0.05em] text-white md:text-6xl">
                  Fahrzeugsuche und Inserieren.
                  <br />
                  Sonst nichts.
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                  Diese oeffentliche Version von Carvia ist bewusst klein gehalten. Sie zeigt fahrbare Suche gegen
                  Demo-Fahrzeuge und erlaubt es, eigene Inserate direkt im Browser hinzuzufuegen.
                </p>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/5 p-4">
                <Image
                  src="/assets/mobile-de/redesign-banner.png"
                  alt="Carvia Marktplatz"
                  width={1400}
                  height={420}
                  className="h-auto w-full rounded-[22px]"
                  priority
                />
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-3">
          {[
            ["Treffer gesamt", String(filteredVehicles.length)],
            ["Eigene Inserate", String(listings.length)],
            ["Demo-Marktbestand", String(demoVehicles.length)],
          ].map(([label, value]) => (
            <article key={label} className="rounded-[28px] border border-white/8 bg-[var(--surface)] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--foreground-muted)]">{label}</p>
              <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-white">{value}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div id="suche" className="rounded-[32px] border border-white/8 bg-[var(--surface)] p-5 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Fahrzeuge suchen</p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">Reine Suchoberflaeche</h2>
              </div>
              <button
                type="button"
                onClick={() => setFilters(emptySearchFilters)}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200"
              >
                Filter zuruecksetzen
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white">Suche</span>
                <input
                  value={filters.query}
                  onChange={(event) => updateFilter("query", event.target.value)}
                  placeholder="BMW, SUV, Tesla, Touring"
                  className="w-full rounded-[18px] border border-white/10 bg-[var(--surface-strong)] px-4 py-3 text-white outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white">Marke</span>
                <select
                  value={filters.make}
                  onChange={(event) => updateFilter("make", event.target.value)}
                  className="w-full rounded-[18px] border border-white/10 bg-[var(--surface-strong)] px-4 py-3 text-white outline-none"
                >
                  <option value="">Alle Marken</option>
                  {availableMakes.map((make) => (
                    <option key={make} value={make}>
                      {make}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white">Kraftstoff</span>
                <select
                  value={filters.fuelType}
                  onChange={(event) => updateFilter("fuelType", event.target.value as SearchFilters["fuelType"])}
                  className="w-full rounded-[18px] border border-white/10 bg-[var(--surface-strong)] px-4 py-3 text-white outline-none"
                >
                  <option value="">Alle</option>
                  <option value="Petrol">Benzin</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Electric">Elektro</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white">Getriebe</span>
                <select
                  value={filters.transmission}
                  onChange={(event) =>
                    updateFilter("transmission", event.target.value as SearchFilters["transmission"])
                  }
                  className="w-full rounded-[18px] border border-white/10 bg-[var(--surface-strong)] px-4 py-3 text-white outline-none"
                >
                  <option value="">Alle</option>
                  <option value="Automatic">Automatik</option>
                  <option value="Manual">Manuell</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white">Preis bis</span>
                <input
                  value={filters.maxPrice}
                  onChange={(event) => updateFilter("maxPrice", event.target.value)}
                  type="number"
                  min={0}
                  placeholder="40000"
                  className="w-full rounded-[18px] border border-white/10 bg-[var(--surface-strong)] px-4 py-3 text-white outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white">Kilometer bis</span>
                <input
                  value={filters.maxMileage}
                  onChange={(event) => updateFilter("maxMileage", event.target.value)}
                  type="number"
                  min={0}
                  placeholder="80000"
                  className="w-full rounded-[18px] border border-white/10 bg-[var(--surface-strong)] px-4 py-3 text-white outline-none"
                />
              </label>
            </div>

            <div className="mt-6 grid gap-4">
              {filteredVehicles.map((vehicle) => (
                <article
                  key={vehicle.id}
                  className="grid gap-4 rounded-[28px] border border-white/8 bg-[var(--surface-strong)] p-4 md:grid-cols-[240px_minmax(0,1fr)]"
                >
                  <div className="overflow-hidden rounded-[22px] bg-white/5">
                    <img src={vehicle.image} alt={`${vehicle.make} ${vehicle.variant}`} className="h-48 w-full object-cover" />
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-2xl font-black tracking-[-0.04em] text-white">
                          {vehicle.make} {vehicle.variant}
                        </p>
                        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                          {vehicle.model} | {vehicle.location} | {vehicle.bodyType}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-200">
                          {vehicle.source === "carvia" ? "Carvia Inserat" : "Demo-Markt"}
                        </span>
                        <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white">
                          {formatCurrency(vehicle.priceGross)}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {[
                        ["EZ", vehicle.firstRegistration],
                        ["KM", `${vehicle.mileageKm.toLocaleString("de-DE")} km`],
                        ["Antrieb", vehicle.fuelType],
                        ["Getriebe", vehicle.transmission === "Automatic" ? "Automatik" : "Manuell"],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-[20px] bg-black/14 p-3">
                          <p className="text-xs uppercase tracking-[0.16em] text-[var(--foreground-muted)]">{label}</p>
                          <p className="mt-2 text-sm font-semibold text-white">{value}</p>
                        </div>
                      ))}
                    </div>

                    <p className="text-sm text-[var(--foreground-muted)]">
                      {vehicle.powerHp} PS. Diese oeffentliche Version zeigt Fahrzeugsuche ohne internen Workflow.
                    </p>
                  </div>
                </article>
              ))}

              {filteredVehicles.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-white/12 bg-[var(--surface-strong)] px-5 py-8 text-center">
                  <p className="text-xl font-bold text-white">Keine Fahrzeuge gefunden</p>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                    Passe die Filter an oder fuege unten ein eigenes Inserat hinzu.
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <div id="inserieren" className="rounded-[32px] border border-white/8 bg-[var(--surface)] p-5 md:p-6">
            <p className="text-xs uppercase tracking-[0.28em] text-[var(--foreground-muted)]">Fahrzeug inserieren</p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">Direkt im Browser anlegen</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)]">
              Eigene Inserate werden in dieser oeffentlichen Version lokal im Browser gespeichert und sofort in die
              Suche uebernommen.
            </p>

            <form onSubmit={submitListing} className="mt-6 grid gap-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white">Marke</span>
                <input
                  value={listingForm.make}
                  onChange={(event) => updateListingForm("make", event.target.value)}
                  placeholder="BMW"
                  className="w-full rounded-[18px] border border-white/10 bg-[var(--surface-strong)] px-4 py-3 text-white outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white">Modell</span>
                <input
                  value={listingForm.model}
                  onChange={(event) => updateListingForm("model", event.target.value)}
                  placeholder="3 Series"
                  className="w-full rounded-[18px] border border-white/10 bg-[var(--surface-strong)] px-4 py-3 text-white outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-white">Variante</span>
                <input
                  value={listingForm.variant}
                  onChange={(event) => updateListingForm("variant", event.target.value)}
                  placeholder="320d Touring"
                  className="w-full rounded-[18px] border border-white/10 bg-[var(--surface-strong)] px-4 py-3 text-white outline-none"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Preis</span>
                  <input
                    value={listingForm.priceGross}
                    onChange={(event) => updateListingForm("priceGross", event.target.value)}
                    type="number"
                    min={0}
                    placeholder="32990"
                    className="w-full rounded-[18px] border border-white/10 bg-[var(--surface-strong)] px-4 py-3 text-white outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Kilometer</span>
                  <input
                    value={listingForm.mileageKm}
                    onChange={(event) => updateListingForm("mileageKm", event.target.value)}
                    type="number"
                    min={0}
                    placeholder="42000"
                    className="w-full rounded-[18px] border border-white/10 bg-[var(--surface-strong)] px-4 py-3 text-white outline-none"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Leistung (PS)</span>
                  <input
                    value={listingForm.powerHp}
                    onChange={(event) => updateListingForm("powerHp", event.target.value)}
                    type="number"
                    min={0}
                    placeholder="190"
                    className="w-full rounded-[18px] border border-white/10 bg-[var(--surface-strong)] px-4 py-3 text-white outline-none"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Ort</span>
                  <input
                    value={listingForm.location}
                    onChange={(event) => updateListingForm("location", event.target.value)}
                    placeholder="Koeln"
                    className="w-full rounded-[18px] border border-white/10 bg-[var(--surface-strong)] px-4 py-3 text-white outline-none"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Karosserie</span>
                  <select
                    value={listingForm.bodyType}
                    onChange={(event) => updateListingForm("bodyType", event.target.value as BodyType)}
                    className="w-full rounded-[18px] border border-white/10 bg-[var(--surface-strong)] px-4 py-3 text-white outline-none"
                  >
                    {Object.keys(vehicleImageByBodyType).map((bodyType) => (
                      <option key={bodyType} value={bodyType}>
                        {bodyType}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Erstzulassung</span>
                  <input
                    value={listingForm.firstRegistration}
                    onChange={(event) => updateListingForm("firstRegistration", event.target.value)}
                    placeholder="2023-01"
                    className="w-full rounded-[18px] border border-white/10 bg-[var(--surface-strong)] px-4 py-3 text-white outline-none"
                  />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Kraftstoff</span>
                  <select
                    value={listingForm.fuelType}
                    onChange={(event) => updateListingForm("fuelType", event.target.value as FuelType)}
                    className="w-full rounded-[18px] border border-white/10 bg-[var(--surface-strong)] px-4 py-3 text-white outline-none"
                  >
                    <option value="Petrol">Benzin</option>
                    <option value="Diesel">Diesel</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Electric">Elektro</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-white">Getriebe</span>
                  <select
                    value={listingForm.transmission}
                    onChange={(event) => updateListingForm("transmission", event.target.value as Transmission)}
                    className="w-full rounded-[18px] border border-white/10 bg-[var(--surface-strong)] px-4 py-3 text-white outline-none"
                  >
                    <option value="Automatic">Automatik</option>
                    <option value="Manual">Manuell</option>
                  </select>
                </label>
              </div>

              <button
                type="submit"
                className="rounded-[18px] bg-[var(--accent)] px-5 py-3 text-sm font-extrabold uppercase tracking-[0.14em] text-white"
              >
                Fahrzeug inserieren
              </button>

              <div className="rounded-[22px] border border-white/8 bg-black/14 p-4">
                <p className="text-sm font-semibold text-white">{saveMessage || "Noch kein neues Inserat gespeichert."}</p>
                <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                  Die Inserate bleiben in dieser Sites-Version lokal im Browser gespeichert.
                </p>
              </div>
            </form>
          </div>
        </section>
      </section>
    </main>
  );
}
