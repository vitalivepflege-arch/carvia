"use client";

import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import {
  HiAdjustmentsHorizontal,
  HiArrowLeft,
  HiArrowPath,
  HiArrowRight,
  HiBars3BottomLeft,
  HiCheck,
  HiChevronRight,
  HiHeart,
  HiHome,
  HiMagnifyingGlass,
  HiMapPin,
  HiOutlineHeart,
  HiOutlinePhone,
  HiOutlineXMark,
} from "react-icons/hi2";
import { IoFlashOutline } from "react-icons/io5";
import {
  PiCarProfileBold,
  PiGasCan,
  PiGauge,
  PiGearSix,
  PiLightning,
  PiMotorcycle,
  PiTruck,
} from "react-icons/pi";
import { TbManualGearbox } from "react-icons/tb";

type FuelType = "Benzin" | "Diesel" | "Elektro" | "Hybrid";
type Transmission = "Automatik" | "Manuell";
type BodyType = "Cabrio" | "Coupe" | "Kleinwagen" | "Limousine" | "SUV" | "Kombi";
type PaymentMode = "Kaufen" | "Leasen";
type AppTab = "home" | "search" | "sell";
type OverlayType = "fuel" | "make" | "mileage" | "more" | "price" | null;

type VehicleRecord = {
  bodyType: BodyType;
  dealerCity: string;
  dealerName: string;
  description: string;
  features: string[];
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
  priceRating: "Guter Preis" | "Fairer Preis" | "Top Preis";
  sellerType: "Haendler" | "Privat";
  source: "carvia" | "market";
  transmission: Transmission;
  variant: string;
};

type SearchFilters = {
  electricOnly: boolean;
  firstRegistrationFrom: string;
  fuelType: "" | FuelType;
  make: string;
  maxMileage: string;
  maxPrice: string;
  minPrice: string;
  model: string;
  paymentMode: PaymentMode;
  postalCode: string;
  query: string;
  transmission: "" | Transmission;
};

type ListingFormState = {
  bodyType: BodyType;
  dealerName: string;
  description: string;
  firstRegistration: string;
  fuelType: FuelType;
  location: string;
  make: string;
  mileageKm: string;
  model: string;
  postalCode: string;
  powerHp: string;
  priceGross: string;
  transmission: Transmission;
  variant: string;
};

const storageKey = "carvia-mobile-search-listings";
const favoritesKey = "carvia-mobile-search-favorites";

const vehicleImageByBodyType: Record<BodyType, string> = {
  Cabrio: "/assets/vehicle-stock/convertible.svg",
  Coupe: "/assets/vehicle-stock/coupe.svg",
  Kleinwagen: "/assets/vehicle-stock/hatchback.svg",
  Limousine: "/assets/vehicle-stock/sedan.svg",
  SUV: "/assets/vehicle-stock/suv.svg",
  Kombi: "/assets/vehicle-stock/wagon.svg",
};

const makeModelMap: Record<string, string[]> = {
  Audi: ["A3", "A4", "A6", "Q5", "Q7", "e-tron GT"],
  BMW: ["1er", "3er", "5er", "X3", "X5", "i4"],
  Ford: ["Focus", "Kuga", "Mustang", "Puma"],
  Mercedes: ["A-Klasse", "C-Klasse", "E-Klasse", "GLC", "GLE"],
  Porsche: ["911", "Cayenne", "Macan", "Panamera", "Taycan"],
  Tesla: ["Model 3", "Model Y", "Model S", "Model X"],
  Volkswagen: ["Golf", "Passat", "Tiguan", "Touareg", "ID.4"],
};

const popularMakes = ["Mercedes", "BMW", "Audi", "Volkswagen", "Porsche", "Ford", "Tesla"];
const fuelOptions: Array<SearchFilters["fuelType"] | ""> = ["", "Benzin", "Diesel", "Elektro", "Hybrid"];
const registrationOptions = ["", "2018", "2019", "2020", "2021", "2022", "2023", "2024"];
const mileageOptions = ["", "5000", "10000", "20000", "40000", "60000", "80000", "120000"];
const priceOptions = ["", "10000", "20000", "30000", "40000", "50000", "75000", "100000", "150000"];

const demoVehicles: VehicleRecord[] = [
  {
    id: "porsche-911-cabrio",
    make: "Porsche",
    model: "911",
    variant: "911/992 Carrera S Cabrio",
    bodyType: "Cabrio",
    fuelType: "Benzin",
    transmission: "Automatik",
    firstRegistration: "2021-08",
    mileageKm: 113000,
    powerHp: 450,
    priceGross: 114990,
    priceRating: "Fairer Preis",
    location: "Worms",
    dealerName: "Autohaus ADLER",
    dealerCity: "67549 Worms",
    sellerType: "Haendler",
    description:
      "Porsche 911/992 Carrera S Cabriolet mit Sport-Chrono-Paket, Matrix-Licht und schwarzem Sport-Design-Paket.",
    features: ["Unfallfrei", "Sport-Design", "MwSt. ausweisbar", "Matrix LED"],
    image: "/assets/vehicle-stock/convertible.svg",
    source: "market",
  },
  {
    id: "bmw-330d-touring",
    make: "BMW",
    model: "3er",
    variant: "330d Touring M Sport",
    bodyType: "Kombi",
    fuelType: "Diesel",
    transmission: "Automatik",
    firstRegistration: "2022-04",
    mileageKm: 64000,
    powerHp: 286,
    priceGross: 34980,
    priceRating: "Top Preis",
    location: "Koeln",
    dealerName: "Rhein Automobile",
    dealerCity: "50933 Koeln",
    sellerType: "Haendler",
    description: "Langstreckentauglicher Touring mit M Sportpaket, Head-up-Display und adaptivem Fahrwerk.",
    features: ["Scheckheft", "M Sport", "Head-up Display"],
    image: "/assets/vehicle-stock/wagon.svg",
    source: "market",
  },
  {
    id: "audi-q5-tfsi-e",
    make: "Audi",
    model: "Q5",
    variant: "50 TFSI e quattro",
    bodyType: "SUV",
    fuelType: "Hybrid",
    transmission: "Automatik",
    firstRegistration: "2023-03",
    mileageKm: 37000,
    powerHp: 299,
    priceGross: 45980,
    priceRating: "Guter Preis",
    location: "Leipzig",
    dealerName: "Leipzig Select Cars",
    dealerCity: "04109 Leipzig",
    sellerType: "Haendler",
    description: "Plug-in-Hybrid SUV mit quattro, S line Exterieur und digitalem Cockpit.",
    features: ["quattro", "S line", "PHEV"],
    image: "/assets/vehicle-stock/suv.svg",
    source: "market",
  },
  {
    id: "vw-golf-gti",
    make: "Volkswagen",
    model: "Golf",
    variant: "GTI Clubsport",
    bodyType: "Kleinwagen",
    fuelType: "Benzin",
    transmission: "Automatik",
    firstRegistration: "2022-06",
    mileageKm: 41000,
    powerHp: 300,
    priceGross: 33200,
    priceRating: "Top Preis",
    location: "Leipzig",
    dealerName: "Sachsen Performance",
    dealerCity: "04315 Leipzig",
    sellerType: "Haendler",
    description: "Golf GTI Clubsport mit Schalensitzen, Akrapovic und Performance-Paket.",
    features: ["Clubsport", "Performance", "Schalensitze"],
    image: "/assets/vehicle-stock/hatchback.svg",
    source: "market",
  },
  {
    id: "tesla-model-y",
    make: "Tesla",
    model: "Model Y",
    variant: "Performance AWD",
    bodyType: "SUV",
    fuelType: "Elektro",
    transmission: "Automatik",
    firstRegistration: "2023-09",
    mileageKm: 24000,
    powerHp: 534,
    priceGross: 46990,
    priceRating: "Fairer Preis",
    location: "Dresden",
    dealerName: "eMotion Cars",
    dealerCity: "01067 Dresden",
    sellerType: "Haendler",
    description: "Model Y Performance mit Autopilot, 21-Zoll Uberturbine und schwarzem Interieur.",
    features: ["AWD", "Autopilot", "Performance"],
    image: "/assets/vehicle-stock/suv.svg",
    source: "market",
  },
  {
    id: "mercedes-c220d",
    make: "Mercedes",
    model: "C-Klasse",
    variant: "C 220 d T AMG Line",
    bodyType: "Kombi",
    fuelType: "Diesel",
    transmission: "Automatik",
    firstRegistration: "2022-07",
    mileageKm: 58000,
    powerHp: 200,
    priceGross: 36490,
    priceRating: "Guter Preis",
    location: "Bremen",
    dealerName: "Nord Stern Fahrzeuge",
    dealerCity: "28195 Bremen",
    sellerType: "Haendler",
    description: "C-Klasse T-Modell mit AMG Line, Burmester und volldigitalem Cockpit.",
    features: ["AMG Line", "Burmester", "Digital Light"],
    image: "/assets/vehicle-stock/wagon.svg",
    source: "market",
  },
];

const emptySearchFilters: SearchFilters = {
  query: "",
  make: "",
  model: "",
  firstRegistrationFrom: "",
  maxMileage: "",
  minPrice: "",
  maxPrice: "",
  postalCode: "",
  fuelType: "",
  transmission: "",
  electricOnly: false,
  paymentMode: "Kaufen",
};

const emptyListingForm: ListingFormState = {
  make: "",
  model: "",
  variant: "",
  bodyType: "SUV",
  firstRegistration: "2023-01",
  mileageKm: "",
  fuelType: "Benzin",
  transmission: "Automatik",
  powerHp: "",
  priceGross: "",
  location: "",
  postalCode: "",
  dealerName: "",
  description: "",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("de-DE").format(value);
}

function formatMonthYear(value: string) {
  const [year, month] = value.split("-");
  if (!year || !month) {
    return value;
  }

  return `${month}/${year}`;
}

function makeSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function filterLabel(value: string, fallback: string, suffix = "") {
  if (!value) {
    return fallback;
  }

  return `${formatNumber(Number(value))}${suffix}`;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<AppTab>("search");
  const [overlay, setOverlay] = useState<OverlayType>(null);
  const [filters, setFilters] = useState<SearchFilters>(emptySearchFilters);
  const [listings, setListings] = useState<VehicleRecord[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const rawListings = window.localStorage.getItem(storageKey);
      if (!rawListings) {
        return [];
      }

      const parsedListings = JSON.parse(rawListings) as VehicleRecord[];
      return Array.isArray(parsedListings) ? parsedListings : [];
    } catch {
      return [];
    }
  });
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const rawFavorites = window.localStorage.getItem(favoritesKey);
      if (!rawFavorites) {
        return [];
      }

      const parsedFavorites = JSON.parse(rawFavorites) as string[];
      return Array.isArray(parsedFavorites) ? parsedFavorites : [];
    } catch {
      return [];
    }
  });
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRecord | null>(null);
  const [listingStep, setListingStep] = useState(0);
  const [listingForm, setListingForm] = useState<ListingFormState>(emptyListingForm);
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(listings));
  }, [listings]);

  useEffect(() => {
    window.localStorage.setItem(favoritesKey, JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  const allVehicles = useMemo(() => [...listings, ...demoVehicles], [listings]);

  const availableMakes = useMemo(() => {
    return [...new Set([...Object.keys(makeModelMap), ...allVehicles.map((vehicle) => vehicle.make)])].sort((left, right) =>
      left.localeCompare(right),
    );
  }, [allVehicles]);

  const filteredModels = useMemo(() => {
    return filters.make && makeModelMap[filters.make] ? makeModelMap[filters.make] : [];
  }, [filters.make]);

  const filteredVehicles = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLowerCase();
    const normalizedMake = filters.make.trim().toLowerCase();
    const maxMileage = filters.maxMileage ? Number(filters.maxMileage) : null;
    const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : null;
    const minPrice = filters.minPrice ? Number(filters.minPrice) : null;
    const firstRegistrationFrom = filters.firstRegistrationFrom ? Number(filters.firstRegistrationFrom) : null;
    const normalizedPostal = filters.postalCode.trim().toLowerCase();

    return allVehicles.filter((vehicle) => {
      if (
        normalizedQuery &&
        !`${vehicle.make} ${vehicle.model} ${vehicle.variant} ${vehicle.location} ${vehicle.description}`
          .toLowerCase()
          .includes(normalizedQuery)
      ) {
        return false;
      }

      if (normalizedMake && vehicle.make.toLowerCase() !== normalizedMake) {
        return false;
      }

      if (filters.model && vehicle.model !== filters.model) {
        return false;
      }

      if (filters.fuelType && vehicle.fuelType !== filters.fuelType) {
        return false;
      }

      if (filters.transmission && vehicle.transmission !== filters.transmission) {
        return false;
      }

      if (filters.electricOnly && vehicle.fuelType !== "Elektro") {
        return false;
      }

      if (maxMileage !== null && vehicle.mileageKm > maxMileage) {
        return false;
      }

      if (maxPrice !== null && vehicle.priceGross > maxPrice) {
        return false;
      }

      if (minPrice !== null && vehicle.priceGross < minPrice) {
        return false;
      }

      if (firstRegistrationFrom !== null && Number(vehicle.firstRegistration.slice(0, 4)) < firstRegistrationFrom) {
        return false;
      }

      if (normalizedPostal && !`${vehicle.location} ${vehicle.dealerCity}`.toLowerCase().includes(normalizedPostal)) {
        return false;
      }

      return true;
    });
  }, [allVehicles, filters]);

  const featuredVehicles = useMemo(() => filteredVehicles.slice(0, 3), [filteredVehicles]);
  const favoriteVehicles = useMemo(
    () => allVehicles.filter((vehicle) => favoriteIds.includes(vehicle.id)),
    [allVehicles, favoriteIds],
  );

  function updateFilter<Key extends keyof SearchFilters>(key: Key, value: SearchFilters[Key]) {
    setFilters((current) => {
      const next = { ...current, [key]: value };

      if (key === "make") {
        const nextMake = value as SearchFilters["make"];
        const availableModels = nextMake ? makeModelMap[nextMake] ?? [] : [];

        if (!nextMake || (next.model && !availableModels.includes(next.model))) {
          next.model = "";
        }
      }

      return next;
    });
  }

  function updateListingForm<Key extends keyof ListingFormState>(key: Key, value: ListingFormState[Key]) {
    setListingForm((current) => ({ ...current, [key]: value }));
  }

  function resetFilters() {
    setFilters(emptySearchFilters);
    setOverlay(null);
  }

  function toggleFavorite(vehicleId: string) {
    setFavoriteIds((current) =>
      current.includes(vehicleId) ? current.filter((entry) => entry !== vehicleId) : [vehicleId, ...current],
    );
  }

  function validateListingStep(step: number) {
    if (step === 0) {
      return Boolean(listingForm.make.trim() && listingForm.model.trim() && listingForm.variant.trim());
    }

    if (step === 1) {
      return Boolean(listingForm.firstRegistration && listingForm.mileageKm && listingForm.powerHp);
    }

    return Boolean(listingForm.priceGross && listingForm.location.trim() && listingForm.postalCode.trim());
  }

  function nextListingStep() {
    if (!validateListingStep(listingStep)) {
      setSaveMessage("Bitte die Pflichtfelder im aktuellen Schritt ausfuellen.");
      return;
    }

    setSaveMessage("");
    setListingStep((current) => Math.min(current + 1, 2));
  }

  function submitListing() {
    if (!validateListingStep(2)) {
      setSaveMessage("Bitte Preis, Ort und PLZ ausfuellen.");
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
      priceRating: "Fairer Preis",
      location: listingForm.location.trim(),
      dealerName: listingForm.dealerName.trim() || "Privatanbieter",
      dealerCity: `${listingForm.postalCode.trim()} ${listingForm.location.trim()}`,
      sellerType: listingForm.dealerName.trim() ? "Haendler" : "Privat",
      description:
        listingForm.description.trim() ||
        `${listingForm.make} ${listingForm.variant} in ${listingForm.location.trim()} inseriert ueber Carvia.`,
      features: [listingForm.bodyType, listingForm.transmission, listingForm.fuelType],
      image: vehicleImageByBodyType[listingForm.bodyType],
      source: "carvia",
    };

    setListings((current) => [record, ...current]);
    setSelectedVehicle(record);
    setActiveTab("search");
    setListingForm(emptyListingForm);
    setListingStep(0);
    setSaveMessage(`Inserat gespeichert: ${record.make} ${record.variant}`);
  }

  function openVehicleDetail(vehicle: VehicleRecord) {
    setSelectedVehicle(vehicle);
  }

  const resultCount = filteredVehicles.length;

  return (
    <main className="min-h-screen bg-[var(--background)] text-white">
      <div className="mx-auto min-h-screen max-w-[440px] bg-[var(--background)] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
        <header className="sticky top-0 z-20 border-b border-white/6 bg-[rgba(26,24,31,0.94)] px-4 pb-4 pt-5 backdrop-blur">
          <div className="flex items-center justify-between">
            <button
              type="button"
              className="icon-button"
              onClick={() => (selectedVehicle ? setSelectedVehicle(null) : setActiveTab("home"))}
            >
              <HiArrowLeft className="text-[22px]" />
            </button>
            <p className="text-[21px] font-bold tracking-[-0.03em]">
              {selectedVehicle ? `${selectedVehicle.make} ${selectedVehicle.model}` : activeTab === "sell" ? "Verkaufen" : "Suchen"}
            </p>
            <button type="button" className="icon-button" onClick={resetFilters}>
              <HiArrowPath className="text-[21px]" />
            </button>
          </div>
        </header>

        {selectedVehicle ? (
          <VehicleDetail
            vehicle={selectedVehicle}
            isFavorite={favoriteIds.includes(selectedVehicle.id)}
            onBack={() => setSelectedVehicle(null)}
            onToggleFavorite={() => toggleFavorite(selectedVehicle.id)}
          />
        ) : activeTab === "sell" ? (
          <section className="px-4 pb-28 pt-4">
            <SellFlow
              listingForm={listingForm}
              listingStep={listingStep}
              saveMessage={saveMessage}
              onBackStep={() => setListingStep((current) => Math.max(current - 1, 0))}
              onChange={updateListingForm}
              onNextStep={nextListingStep}
              onSubmit={submitListing}
            />
          </section>
        ) : (
          <section className="pb-28">
            {activeTab === "home" ? (
              <div className="px-4 pt-4">
                <HomeOverview
                  featuredVehicles={featuredVehicles}
                  favoriteVehicles={favoriteVehicles}
                  resultCount={resultCount}
                  onOpenSearch={() => setActiveTab("search")}
                  onOpenSell={() => setActiveTab("sell")}
                  onOpenVehicle={openVehicleDetail}
                />
              </div>
            ) : null}

            <div className={activeTab === "search" ? "block" : "hidden"}>
              <SearchExperience
                availableMakes={availableMakes}
                filteredModels={filteredModels}
                filteredVehicles={filteredVehicles}
                filters={filters}
                favoriteIds={favoriteIds}
                overlay={overlay}
                resultCount={resultCount}
                setOverlay={setOverlay}
                updateFilter={updateFilter}
                onOpenVehicle={openVehicleDetail}
                onReset={resetFilters}
                onToggleFavorite={toggleFavorite}
              />
            </div>
          </section>
        )}

        <nav className="fixed bottom-0 left-1/2 z-30 flex w-full max-w-[440px] -translate-x-1/2 items-center justify-around border-t border-white/6 bg-[rgba(26,24,31,0.98)] px-2 py-3">
          {[
            { icon: HiHome, key: "home" as const, label: "Home" },
            { icon: HiMagnifyingGlass, key: "search" as const, label: "Suchen" },
            { icon: PiCarProfileBold, key: "sell" as const, label: "Verkaufen" },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              className={`bottom-nav-item ${activeTab === item.key ? "bottom-nav-item-active" : ""}`}
              onClick={() => {
                setSelectedVehicle(null);
                setActiveTab(item.key);
              }}
            >
              <item.icon className="text-[22px]" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </main>
  );
}

function HomeOverview({
  featuredVehicles,
  favoriteVehicles,
  resultCount,
  onOpenSearch,
  onOpenSell,
  onOpenVehicle,
}: {
  featuredVehicles: VehicleRecord[];
  favoriteVehicles: VehicleRecord[];
  resultCount: number;
  onOpenSearch: () => void;
  onOpenSell: () => void;
  onOpenVehicle: (vehicle: VehicleRecord) => void;
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-[28px] border border-white/6 bg-[var(--surface)] p-5">
        <p className="text-[15px] text-[var(--foreground-muted)]">Millionen Fahrzeuge.</p>
        <h1 className="mt-1 text-[38px] font-black leading-[0.98] tracking-[-0.05em] text-white">
          Eine simple
          <br />
          Suche.
        </h1>
        <button
          type="button"
          onClick={onOpenSearch}
          className="mt-5 flex w-full items-center justify-between rounded-[20px] border border-white/12 bg-[var(--surface-soft)] px-4 py-4 text-left"
        >
          <span className="flex items-center gap-3 text-base text-[var(--foreground-muted)]">
            <HiMagnifyingGlass className="text-[20px] text-white/70" />
            Marke, Modell oder Ort suchen
          </span>
          <span className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--accent)] text-white">
            <HiArrowRight className="text-[22px]" />
          </span>
        </button>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <button type="button" onClick={onOpenSearch} className="rounded-[24px] bg-[var(--accent)] px-4 py-4 text-left">
          <p className="text-xs uppercase tracking-[0.18em] text-white/70">Suche</p>
          <p className="mt-1 text-xl font-bold text-white">{resultCount} Angebote</p>
        </button>
        <button type="button" onClick={onOpenSell} className="rounded-[24px] border border-white/8 bg-[var(--surface)] px-4 py-4 text-left">
          <p className="text-xs uppercase tracking-[0.18em] text-[var(--foreground-muted)]">Inserieren</p>
          <p className="mt-1 text-xl font-bold text-white">Fahrzeug verkaufen</p>
        </button>
      </section>

      <section className="rounded-[28px] border border-white/6 bg-[var(--surface)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[23px] font-bold tracking-[-0.04em]">Top Treffer</h2>
          <button type="button" onClick={onOpenSearch} className="text-sm font-semibold text-[var(--accent-soft)]">
            Alles ansehen
          </button>
        </div>

        <div className="space-y-3">
          {featuredVehicles.map((vehicle) => (
            <button
              key={vehicle.id}
              type="button"
              onClick={() => onOpenVehicle(vehicle)}
              className="w-full rounded-[22px] bg-[var(--surface-card)] p-3 text-left"
            >
              <div className="flex gap-3">
                <img
                  src={vehicle.image}
                  alt={`${vehicle.make} ${vehicle.variant}`}
                  className="h-[92px] w-[108px] rounded-[18px] bg-white/4 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-bold tracking-[-0.03em]">
                    {vehicle.make} {vehicle.model}
                  </p>
                  <p className="truncate text-sm text-[var(--foreground-muted)]">{vehicle.variant}</p>
                  <p className="mt-2 text-[30px] font-black leading-none tracking-[-0.05em]">
                    {formatCurrency(vehicle.priceGross)}
                  </p>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                    EZ {formatMonthYear(vehicle.firstRegistration)} / {formatNumber(vehicle.mileageKm)} km
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/6 bg-[var(--surface)] p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[23px] font-bold tracking-[-0.04em]">Merkliste</h2>
          <span className="text-sm text-[var(--foreground-muted)]">{favoriteVehicles.length} Fahrzeuge</span>
        </div>

        {favoriteVehicles.length === 0 ? (
          <p className="rounded-[20px] bg-[var(--surface-card)] px-4 py-5 text-sm text-[var(--foreground-muted)]">
            Noch keine Fahrzeuge gespeichert. Tippe in der Suche auf das Herz.
          </p>
        ) : (
          <div className="space-y-3">
            {favoriteVehicles.slice(0, 2).map((vehicle) => (
              <button
                key={vehicle.id}
                type="button"
                onClick={() => onOpenVehicle(vehicle)}
                className="flex w-full items-center gap-3 rounded-[20px] bg-[var(--surface-card)] p-3 text-left"
              >
                <img
                  src={vehicle.image}
                  alt={`${vehicle.make} ${vehicle.variant}`}
                  className="h-[72px] w-[86px] rounded-[16px] bg-white/4 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold">
                    {vehicle.make} {vehicle.model}
                  </p>
                  <p className="text-sm text-[var(--foreground-muted)]">{formatCurrency(vehicle.priceGross)}</p>
                </div>
                <HiChevronRight className="text-xl text-[var(--foreground-muted)]" />
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SearchExperience({
  availableMakes,
  filteredModels,
  filteredVehicles,
  filters,
  favoriteIds,
  overlay,
  resultCount,
  setOverlay,
  updateFilter,
  onOpenVehicle,
  onReset,
  onToggleFavorite,
}: {
  availableMakes: string[];
  filteredModels: string[];
  filteredVehicles: VehicleRecord[];
  filters: SearchFilters;
  favoriteIds: string[];
  overlay: OverlayType;
  resultCount: number;
  setOverlay: (overlay: OverlayType) => void;
  updateFilter: <Key extends keyof SearchFilters>(key: Key, value: SearchFilters[Key]) => void;
  onOpenVehicle: (vehicle: VehicleRecord) => void;
  onReset: () => void;
  onToggleFavorite: (vehicleId: string) => void;
}) {
  return (
    <div className="px-4 pt-4">
      <section className="rounded-[30px] border border-white/6 bg-[var(--surface)] pb-4">
        <div className="border-b border-white/6 px-4 pb-5 pt-4">
          <p className="text-center text-[38px] font-black leading-[1.05] tracking-[-0.05em]">
            Millionen Fahrzeuge.
            <br />
            Eine simple Suche.
          </p>

          <div className="mt-5 flex items-center gap-3 rounded-[22px] border border-white/12 bg-[var(--surface-soft)] px-4 py-3">
            <HiMagnifyingGlass className="text-[22px] text-white/65" />
            <input
              value={filters.query}
              onChange={(event) => updateFilter("query", event.target.value)}
              placeholder="VW ID.4 bis 35.000 EUR"
              className="flex-1 bg-transparent text-base text-white outline-none"
            />
            <button
              type="button"
              onClick={() => setOverlay("more")}
              className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[var(--accent)] text-white"
            >
              <HiArrowRight className="text-[22px]" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-5 border-b border-white/6 text-center text-[11px] text-[var(--foreground-muted)]">
          {[
            { icon: PiCarProfileBold, active: true },
            { icon: PiMotorcycle, active: false },
            { icon: PiLightning, active: false },
            { icon: PiTruck, active: false },
            { icon: HiBars3BottomLeft, active: false },
          ].map((item, index) => (
            <button
              key={index}
              type="button"
              className={`flex h-14 items-center justify-center border-r border-white/6 last:border-r-0 ${item.active ? "text-[var(--accent)]" : "text-white/55"}`}
            >
              <item.icon className="text-[24px]" />
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 px-4 pt-4">
          <FilterButton label="Marke" value={filters.make || "Beliebig"} onClick={() => setOverlay("make")} />
          <FilterButton
            label="Modell"
            value={filters.model || "Beliebig"}
            muted={!filteredModels.length}
            onClick={() => setOverlay("more")}
          />
          <FilterButton
            label="Erstzulassung ab"
            value={filters.firstRegistrationFrom || "Beliebig"}
            onClick={() => setOverlay("more")}
          />
          <FilterButton
            label="Kilometer bis"
            value={filterLabel(filters.maxMileage, "Beliebig", " km")}
            onClick={() => setOverlay("mileage")}
          />
        </div>

        <div className="px-4 pt-5">
          <p className="mb-2 text-sm font-semibold">Zahlungsart</p>
          <div className="grid grid-cols-2 rounded-[18px] border border-[var(--border-strong)] bg-[var(--surface-soft)] p-1">
            {(["Kaufen", "Leasen"] as PaymentMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => updateFilter("paymentMode", mode)}
                className={`rounded-[14px] px-4 py-3 text-base font-semibold ${filters.paymentMode === mode ? "border border-[#9055d6] bg-[#24192f] text-white" : "text-white/70"}`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 px-4 pt-4">
          <FilterButton
            label="Preis bis"
            value={filterLabel(filters.maxPrice, "Beliebig", " EUR")}
            onClick={() => setOverlay("price")}
          />
          <FilterButton label="Ort oder PLZ" value={filters.postalCode || "Beliebig"} onClick={() => setOverlay("more")} />
        </div>

        <label className="mx-4 mt-4 flex items-center gap-3">
          <span className={`checkbox ${filters.electricOnly ? "checkbox-active" : ""}`}>
            {filters.electricOnly ? <HiCheck className="text-sm" /> : null}
          </span>
          <input
            type="checkbox"
            checked={filters.electricOnly}
            onChange={(event) => updateFilter("electricOnly", event.target.checked)}
            className="sr-only"
          />
          <span className="text-[17px]">Nur Elektroautos</span>
          <span className="ml-1 rounded-md bg-[#4b6dd4] px-1.5 py-0.5 text-xs font-bold">EV</span>
        </label>

        <div className="px-4 pt-5">
          <button type="button" className="w-full rounded-[18px] bg-[var(--accent)] px-5 py-4 text-lg font-bold text-white">
            <span className="inline-flex items-center gap-2">
              <HiMagnifyingGlass className="text-[20px]" />
              {formatNumber(resultCount)} Angebote
            </span>
          </button>
        </div>

        <div className="flex items-center justify-between px-4 pt-4 text-sm text-[var(--foreground-muted)]">
          <button type="button" onClick={onReset} className="inline-flex items-center gap-2 font-semibold">
            <HiArrowPath className="text-base" />
            Zuruecksetzen
          </button>
          <button type="button" onClick={() => setOverlay("more")} className="inline-flex items-center gap-2 font-semibold">
            <HiAdjustmentsHorizontal className="text-base" />
            Weitere Filter
          </button>
        </div>
      </section>

      <section className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[30px] font-black tracking-[-0.05em]">{formatNumber(resultCount)} Angebote</p>
          <div className="flex gap-2 text-[var(--foreground-muted)]">
            <button type="button" className="icon-button">
              <HiArrowPath className="text-[18px]" />
            </button>
            <button type="button" className="icon-button">
              <HiBars3BottomLeft className="text-[18px]" />
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredVehicles.map((vehicle) => (
            <button
              key={vehicle.id}
              type="button"
              onClick={() => onOpenVehicle(vehicle)}
              className="w-full rounded-[24px] bg-[var(--surface-card-alt)] p-3 text-left"
            >
              <div className="flex gap-3">
                <img
                  src={vehicle.image}
                  alt={`${vehicle.make} ${vehicle.variant}`}
                  className="h-[112px] w-[118px] rounded-[18px] bg-[#152235] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[18px] font-bold leading-[1.12] tracking-[-0.03em]">
                    {vehicle.make} {vehicle.variant}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <p className="text-[22px] font-black tracking-[-0.04em]">{formatCurrency(vehicle.priceGross)}</p>
                    <span className="rounded-full bg-[#1b3c31] px-2 py-0.5 text-xs font-bold text-[#8be29b]">
                      {vehicle.priceRating}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                    Unfallfrei / EZ {formatMonthYear(vehicle.firstRegistration)} / {formatNumber(vehicle.mileageKm)} km
                  </p>
                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    {vehicle.powerHp} PS / {vehicle.fuelType}
                  </p>
                </div>
              </div>

              <div className="mt-3 border-t border-white/6 pt-3">
                <p className="text-base font-semibold">{vehicle.dealerName}</p>
                <p className="text-sm text-[var(--foreground-muted)]">{vehicle.dealerCity}</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--accent-soft)]">Finanzierung berechnen</p>
                  <div className="flex gap-2">
                    <button type="button" className="mini-action-button">
                      <HiOutlinePhone className="text-[18px]" />
                    </button>
                    <button
                      type="button"
                      className="mini-action-button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggleFavorite(vehicle.id);
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
              </div>
            </button>
          ))}
        </div>
      </section>

      {overlay ? (
        <FilterOverlay
          availableMakes={availableMakes}
          filteredModels={filteredModels}
          filters={filters}
          overlay={overlay}
          setOverlay={setOverlay}
          updateFilter={updateFilter}
        />
      ) : null}
    </div>
  );
}

function FilterButton({
  label,
  muted,
  onClick,
  value,
}: {
  label: string;
  muted?: boolean;
  onClick?: () => void;
  value: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[18px] border border-[var(--border-strong)] bg-[var(--surface-soft)] px-4 py-3 text-left ${onClick ? "" : "opacity-60"}`}
    >
      <p className="text-sm font-semibold">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <span className={`truncate text-[18px] ${muted ? "text-white/40" : "text-white/80"}`}>{value}</span>
        <HiChevronRight className="shrink-0 text-[18px] text-white/55" />
      </div>
    </button>
  );
}

function FilterOverlay({
  availableMakes,
  filteredModels,
  filters,
  overlay,
  setOverlay,
  updateFilter,
}: {
  availableMakes: string[];
  filteredModels: string[];
  filters: SearchFilters;
  overlay: OverlayType;
  setOverlay: (overlay: OverlayType) => void;
  updateFilter: <Key extends keyof SearchFilters>(key: Key, value: SearchFilters[Key]) => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-end bg-black/60 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full overflow-y-auto rounded-t-[30px] bg-[var(--background)] px-4 pb-8 pt-4">
        <div className="mb-5 flex items-center justify-between">
          <button type="button" className="icon-button" onClick={() => setOverlay(null)}>
            <HiOutlineXMark className="text-[21px]" />
          </button>
          <p className="text-[22px] font-bold">
            {overlay === "make"
              ? "Alle Marken"
              : overlay === "price"
                ? "Preis"
                : overlay === "mileage"
                  ? "Kilometerstand"
                  : overlay === "fuel"
                    ? "Kraftstoffart"
                    : "Weitere Filter"}
          </p>
          <button type="button" className="text-base font-semibold text-white" onClick={() => setOverlay(null)}>
            Fertig
          </button>
        </div>

        {overlay === "make" ? (
          <div className="space-y-3">
            <div className="sheet-card">
              <button type="button" className="sheet-list-item" onClick={() => updateFilter("make", "")}>
                <span>Beliebig</span>
                {!filters.make ? <HiCheck className="text-xl text-white" /> : <HiChevronRight className="text-xl text-white/50" />}
              </button>
            </div>

            <p className="px-1 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--foreground-muted)]">Top-Marken</p>

            <div className="sheet-card">
              {[...new Set([...popularMakes, ...availableMakes])].map((make) => (
                <button
                  key={make}
                  type="button"
                  className="sheet-list-item"
                  onClick={() => {
                    updateFilter("make", make);
                    setOverlay(null);
                  }}
                >
                  <span>{make}</span>
                  {filters.make === make ? <HiCheck className="text-xl text-white" /> : <HiChevronRight className="text-xl text-white/50" />}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {overlay === "price" ? (
          <div className="space-y-5">
            <div className="sheet-card grid grid-cols-2 gap-4 p-4">
              <label>
                <span className="sheet-field-label">Von</span>
                <input
                  value={filters.minPrice}
                  onChange={(event) => updateFilter("minPrice", event.target.value)}
                  placeholder="Beliebig"
                  className="sheet-input"
                />
              </label>
              <label>
                <span className="sheet-field-label">Bis</span>
                <input
                  value={filters.maxPrice}
                  onChange={(event) => updateFilter("maxPrice", event.target.value)}
                  placeholder="Beliebig"
                  className="sheet-input"
                />
              </label>
            </div>

            <div className="sheet-card p-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  {priceOptions.map((option) => (
                    <button
                      key={`min-${option || "all"}`}
                      type="button"
                      onClick={() => updateFilter("minPrice", option)}
                      className={`picker-pill ${filters.minPrice === option ? "picker-pill-active" : ""}`}
                    >
                      {option ? `${formatNumber(Number(option))} EUR` : "Beliebig"}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {priceOptions.map((option) => (
                    <button
                      key={`max-${option || "all"}`}
                      type="button"
                      onClick={() => updateFilter("maxPrice", option)}
                      className={`picker-pill ${filters.maxPrice === option ? "picker-pill-active" : ""}`}
                    >
                      {option ? `${formatNumber(Number(option))} EUR` : "Beliebig"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {overlay === "mileage" ? (
          <div className="space-y-5">
            <div className="sheet-card grid grid-cols-2 gap-4 p-4">
              <div>
                <span className="sheet-field-label">Von</span>
                <div className="sheet-input text-white/45">Beliebig</div>
              </div>
              <label>
                <span className="sheet-field-label">Bis</span>
                <input
                  value={filters.maxMileage}
                  onChange={(event) => updateFilter("maxMileage", event.target.value)}
                  placeholder="Beliebig"
                  className="sheet-input"
                />
              </label>
            </div>

            <div className="sheet-card p-4">
              <div className="space-y-2">
                {mileageOptions.map((option) => (
                  <button
                    key={option || "all"}
                    type="button"
                    onClick={() => updateFilter("maxMileage", option)}
                    className={`picker-pill ${filters.maxMileage === option ? "picker-pill-active" : ""}`}
                  >
                    {option ? `${formatNumber(Number(option))} km` : "Beliebig"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {overlay === "fuel" ? (
          <div className="sheet-card">
            {fuelOptions.map((option) => (
              <button
                key={option || "all"}
                type="button"
                className="sheet-list-item"
                onClick={() => {
                  updateFilter("fuelType", option as SearchFilters["fuelType"]);
                  setOverlay(null);
                }}
              >
                <span>{option || "Beliebig"}</span>
                {filters.fuelType === option ? <HiCheck className="text-xl text-white" /> : <HiChevronRight className="text-xl text-white/50" />}
              </button>
            ))}
          </div>
        ) : null}

        {overlay === "more" ? (
          <div className="space-y-3">
            <div className="sheet-card p-3">
              <div className="search-field">
                <HiMagnifyingGlass className="text-lg text-white/60" />
                <input
                  value={filters.query}
                  onChange={(event) => updateFilter("query", event.target.value)}
                  placeholder="Filter suchen"
                  className="flex-1 bg-transparent outline-none"
                />
              </div>
            </div>

            <div className="sheet-card">
              <button type="button" className="sheet-list-item" onClick={() => setOverlay("price")}>
                <span>Preis</span>
                <span className="text-[var(--foreground-muted)]">{filterLabel(filters.maxPrice, "Beliebig", " EUR")}</span>
              </button>
              <button type="button" className="sheet-list-item" onClick={() => setOverlay("mileage")}>
                <span>Kilometerstand</span>
                <span className="text-[var(--foreground-muted)]">{filterLabel(filters.maxMileage, "Beliebig", " km")}</span>
              </button>
              <button type="button" className="sheet-list-item" onClick={() => setOverlay("fuel")}>
                <span>Kraftstoffart</span>
                <span className="text-[var(--foreground-muted)]">{filters.fuelType || "Beliebig"}</span>
              </button>
            </div>

            <div className="sheet-card p-4">
              <label className="block">
                <span className="sheet-field-label">Erstzulassung ab</span>
                <select
                  value={filters.firstRegistrationFrom}
                  onChange={(event) => updateFilter("firstRegistrationFrom", event.target.value)}
                  className="sheet-input"
                >
                  {registrationOptions.map((option) => (
                    <option key={option || "all"} value={option}>
                      {option || "Beliebig"}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-4 block">
                <span className="sheet-field-label">Ort oder PLZ</span>
                <input
                  value={filters.postalCode}
                  onChange={(event) => updateFilter("postalCode", event.target.value)}
                  placeholder="Beliebig"
                  className="sheet-input"
                />
              </label>

              <label className="mt-4 block">
                <span className="sheet-field-label">Modell</span>
                <select value={filters.model} onChange={(event) => updateFilter("model", event.target.value)} className="sheet-input">
                  <option value="">Beliebig</option>
                  {filteredModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </label>

              <label className="mt-4 block">
                <span className="sheet-field-label">Getriebe</span>
                <select
                  value={filters.transmission}
                  onChange={(event) => updateFilter("transmission", event.target.value as SearchFilters["transmission"])}
                  className="sheet-input"
                >
                  <option value="">Beliebig</option>
                  <option value="Automatik">Automatik</option>
                  <option value="Manuell">Manuell</option>
                </select>
              </label>
            </div>

            <button
              type="button"
              className="w-full rounded-[18px] bg-[var(--accent)] px-5 py-4 text-lg font-bold"
              onClick={() => setOverlay(null)}
            >
              <span className="inline-flex items-center gap-2">
                <HiMagnifyingGlass className="text-[20px]" />
                Filter anwenden
              </span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function VehicleDetail({
  vehicle,
  isFavorite,
  onBack,
  onToggleFavorite,
}: {
  vehicle: VehicleRecord;
  isFavorite: boolean;
  onBack: () => void;
  onToggleFavorite: () => void;
}) {
  return (
    <section className="pb-28">
      <div className="relative">
        <img src={vehicle.image} alt={`${vehicle.make} ${vehicle.variant}`} className="h-[320px] w-full bg-[#152235] object-cover" />
        <div className="absolute left-4 right-4 top-4 flex items-center justify-between">
          <button type="button" className="icon-button bg-black/55" onClick={onBack}>
            <HiArrowLeft className="text-[22px]" />
          </button>
          <button type="button" className="icon-button bg-black/55" onClick={onToggleFavorite}>
            {isFavorite ? <HiHeart className="text-[21px] text-[var(--accent)]" /> : <HiOutlineHeart className="text-[21px]" />}
          </button>
        </div>
        <div className="absolute bottom-4 right-4 rounded-[14px] bg-black/70 px-3 py-1 text-sm font-bold">1/12</div>
      </div>

      <div className="px-4 pt-4">
        <h1 className="text-[18px] font-bold text-white">
          {vehicle.make} {vehicle.model}
        </h1>
        <p className="mt-1 text-[15px] text-white/75">{vehicle.variant}</p>
        <div className="mt-4 flex items-end gap-3">
          <p className="text-[48px] font-black leading-none tracking-[-0.06em]">{formatCurrency(vehicle.priceGross)}</p>
          <span className="mb-1 rounded-full bg-[#1b3c31] px-2 py-1 text-xs font-bold text-[#8be29b]">{vehicle.priceRating}</span>
        </div>
        <p className="mt-2 text-[17px] text-[var(--foreground-muted)]">
          ab 1.220 EUR mtl. <span className="ml-4 text-[var(--accent-soft)] underline">Finanzierung berechnen</span>
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <button type="button" className="contact-button">
            <HiOutlinePhone className="text-[22px]" />
            Anrufen
          </button>
          <button type="button" className="contact-button">
            <HiArrowRight className="text-[22px]" />
            Nachricht
          </button>
        </div>

        <div className="mt-5 rounded-[22px] bg-[#6f2ca3] px-4 py-4">
          <p className="text-lg font-bold">Mit WhatsApp kontaktieren</p>
          <p className="mt-1 text-sm text-white/75">Schneller Kontakt zum Haendler und direkte Rueckfragen.</p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 rounded-[26px] bg-[var(--surface)] p-4">
          <SpecTile icon={PiGauge} label="Kilometerstand" value={`${formatNumber(vehicle.mileageKm)} km`} />
          <SpecTile icon={HiArrowPath} label="Erstzulassung" value={formatMonthYear(vehicle.firstRegistration)} />
          <SpecTile icon={IoFlashOutline} label="Leistung" value={`${vehicle.powerHp} PS`} />
          <SpecTile icon={PiGasCan} label="Kraftstoffart" value={vehicle.fuelType} />
          <SpecTile
            icon={vehicle.transmission === "Automatik" ? PiGearSix : TbManualGearbox}
            label="Getriebe"
            value={vehicle.transmission}
          />
          <SpecTile icon={HiMapPin} label="Standort" value={vehicle.location} />
        </div>

        <section className="mt-5 rounded-[26px] bg-[var(--surface)] p-4">
          <p className="text-[24px] font-bold tracking-[-0.04em]">Ueber diesen Haendler</p>
          <div className="mt-3 flex items-center justify-between rounded-[20px] bg-[var(--surface-card)] p-4">
            <div>
              <p className="text-lg font-bold">{vehicle.dealerName}</p>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">{vehicle.dealerCity}</p>
              <p className="mt-2 text-sm text-[#f6c14f]">
                5.0 Sterne <span className="text-white/80">(580 Bewertungen)</span>
              </p>
            </div>
            <HiChevronRight className="text-[22px] text-white/55" />
          </div>
        </section>

        <section className="mt-5 rounded-[26px] bg-[var(--surface)] p-4">
          <p className="text-[24px] font-bold tracking-[-0.04em]">Besondere Merkmale</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {vehicle.features.map((feature) => (
              <span key={feature} className="rounded-[14px] bg-[var(--surface-card)] px-3 py-2 text-sm">
                {feature}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-5 rounded-[26px] bg-[var(--surface)] p-4">
          <p className="text-[24px] font-bold tracking-[-0.04em]">Beschreibung</p>
          <p className="mt-3 text-[15px] leading-7 text-white/82">{vehicle.description}</p>
        </section>
      </div>
    </section>
  );
}

function SpecTile({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] bg-[var(--surface-card)] p-3">
      <Icon className="text-[28px] text-[var(--accent)]" />
      <p className="mt-3 text-sm text-[var(--foreground-muted)]">{label}</p>
      <p className="mt-1 text-[18px] font-bold">{value}</p>
    </div>
  );
}

function SellFlow({
  listingForm,
  listingStep,
  saveMessage,
  onBackStep,
  onChange,
  onNextStep,
  onSubmit,
}: {
  listingForm: ListingFormState;
  listingStep: number;
  saveMessage: string;
  onBackStep: () => void;
  onChange: <Key extends keyof ListingFormState>(key: Key, value: ListingFormState[Key]) => void;
  onNextStep: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-[28px] bg-[var(--surface)] p-5">
        <p className="text-sm uppercase tracking-[0.16em] text-[var(--foreground-muted)]">Fahrzeug inserieren</p>
        <h1 className="mt-2 text-[34px] font-black leading-[1] tracking-[-0.05em]">In drei Schritten zum Inserat.</h1>
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((step) => (
            <div key={step} className={`h-2 rounded-full ${listingStep >= step ? "bg-[var(--accent)]" : "bg-white/10"}`} />
          ))}
        </div>
      </section>

      <section className="rounded-[28px] bg-[var(--surface)] p-4">
        {listingStep === 0 ? (
          <div className="space-y-4">
            <Field label="Marke">
              <select value={listingForm.make} onChange={(event) => onChange("make", event.target.value)} className="form-input">
                <option value="">Marke waehlen</option>
                {Object.keys(makeModelMap).map((make) => (
                  <option key={make} value={make}>
                    {make}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Modell">
              <input
                value={listingForm.model}
                onChange={(event) => onChange("model", event.target.value)}
                placeholder="z. B. 911 oder Q5"
                className="form-input"
              />
            </Field>
            <Field label="Variante">
              <input
                value={listingForm.variant}
                onChange={(event) => onChange("variant", event.target.value)}
                placeholder="z. B. Carrera S Cabrio"
                className="form-input"
              />
            </Field>
            <Field label="Karosserie">
              <select
                value={listingForm.bodyType}
                onChange={(event) => onChange("bodyType", event.target.value as BodyType)}
                className="form-input"
              >
                {Object.keys(vehicleImageByBodyType).map((bodyType) => (
                  <option key={bodyType} value={bodyType}>
                    {bodyType}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        ) : null}

        {listingStep === 1 ? (
          <div className="space-y-4">
            <Field label="Erstzulassung">
              <input
                value={listingForm.firstRegistration}
                onChange={(event) => onChange("firstRegistration", event.target.value)}
                placeholder="2023-01"
                className="form-input"
              />
            </Field>
            <Field label="Kilometerstand">
              <input
                value={listingForm.mileageKm}
                onChange={(event) => onChange("mileageKm", event.target.value)}
                placeholder="42000"
                className="form-input"
              />
            </Field>
            <Field label="Leistung (PS)">
              <input
                value={listingForm.powerHp}
                onChange={(event) => onChange("powerHp", event.target.value)}
                placeholder="190"
                className="form-input"
              />
            </Field>
            <Field label="Kraftstoff / Getriebe">
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={listingForm.fuelType}
                  onChange={(event) => onChange("fuelType", event.target.value as FuelType)}
                  className="form-input"
                >
                  <option value="Benzin">Benzin</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Elektro">Elektro</option>
                  <option value="Hybrid">Hybrid</option>
                </select>
                <select
                  value={listingForm.transmission}
                  onChange={(event) => onChange("transmission", event.target.value as Transmission)}
                  className="form-input"
                >
                  <option value="Automatik">Automatik</option>
                  <option value="Manuell">Manuell</option>
                </select>
              </div>
            </Field>
          </div>
        ) : null}

        {listingStep === 2 ? (
          <div className="space-y-4">
            <Field label="Preis">
              <input
                value={listingForm.priceGross}
                onChange={(event) => onChange("priceGross", event.target.value)}
                placeholder="32990"
                className="form-input"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ort">
                <input
                  value={listingForm.location}
                  onChange={(event) => onChange("location", event.target.value)}
                  placeholder="Koeln"
                  className="form-input"
                />
              </Field>
              <Field label="PLZ">
                <input
                  value={listingForm.postalCode}
                  onChange={(event) => onChange("postalCode", event.target.value)}
                  placeholder="50667"
                  className="form-input"
                />
              </Field>
            </div>
            <Field label="Haendlername oder privat">
              <input
                value={listingForm.dealerName}
                onChange={(event) => onChange("dealerName", event.target.value)}
                placeholder="Optional: Autohaus Muster"
                className="form-input"
              />
            </Field>
            <Field label="Beschreibung">
              <textarea
                value={listingForm.description}
                onChange={(event) => onChange("description", event.target.value)}
                placeholder="Kurzbeschreibung des Fahrzeugs"
                className="form-input min-h-[120px] resize-none"
              />
            </Field>
          </div>
        ) : null}
      </section>

      <section className="rounded-[28px] bg-[var(--surface)] p-4">
        <p className="text-sm font-semibold text-[var(--foreground-muted)]">Vorschau</p>
        <div className="mt-3 flex gap-3 rounded-[22px] bg-[var(--surface-card)] p-3">
          <img
            src={vehicleImageByBodyType[listingForm.bodyType]}
            alt={listingForm.bodyType}
            className="h-[92px] w-[108px] rounded-[18px] bg-[#152235] object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold">
              {listingForm.make || "Marke"} {listingForm.model || "Modell"}
            </p>
            <p className="truncate text-sm text-[var(--foreground-muted)]">{listingForm.variant || "Variante"}</p>
            <p className="mt-2 text-[28px] font-black tracking-[-0.04em]">
              {listingForm.priceGross ? formatCurrency(Number(listingForm.priceGross)) : "0 EUR"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] bg-[var(--surface)] p-4">
        <p className="text-sm text-white/80">
          {saveMessage || "Das Inserat wird lokal im Browser gespeichert und sofort in der Suche angezeigt."}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onBackStep}
            className="rounded-[18px] border border-white/10 px-4 py-3 text-base font-semibold text-white/85"
          >
            Zurueck
          </button>
          {listingStep < 2 ? (
            <button type="button" onClick={onNextStep} className="rounded-[18px] bg-[var(--accent)] px-4 py-3 text-base font-bold">
              Weiter
            </button>
          ) : (
            <button type="button" onClick={onSubmit} className="rounded-[18px] bg-[var(--accent)] px-4 py-3 text-base font-bold">
              Inserat veroeffentlichen
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

function Field({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}
