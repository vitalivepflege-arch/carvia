import brandLogoMap from "@/lib/brand-logos.json";

export type FuelType = "Benzin" | "Diesel" | "Elektro" | "Hybrid";
export type Transmission = "Automatik" | "Manuell";
export type BodyType = "Cabrio" | "Coupe" | "Kleinwagen" | "Limousine" | "SUV" | "Kombi";
export type PaymentMode = "Kaufen" | "Leasen";

export type VehicleRecord = {
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

export type SearchFilters = {
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

export type ListingFormState = {
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

export const storageKey = "carvia-desktop-listings";

export const vehicleImageByBodyType: Record<BodyType, string> = {
  Cabrio: "/assets/vehicle-stock/convertible.svg",
  Coupe: "/assets/vehicle-stock/coupe.svg",
  Kleinwagen: "/assets/vehicle-stock/hatchback.svg",
  Limousine: "/assets/vehicle-stock/sedan.svg",
  SUV: "/assets/vehicle-stock/suv.svg",
  Kombi: "/assets/vehicle-stock/wagon.svg",
};

export const makeModelMap: Record<string, string[]> = {
  Audi: ["A3", "A4", "A6", "Q5", "Q7", "e-tron GT"],
  BMW: ["1er", "3er", "5er", "X3", "X5", "i4"],
  Ford: ["Focus", "Kuga", "Mustang", "Puma"],
  Hyundai: ["i30", "Tucson", "IONIQ 5"],
  "Mercedes-Benz": ["A-Klasse", "C-Klasse", "E-Klasse", "GLC", "GLE"],
  Opel: ["Astra", "Corsa", "Grandland"],
  Porsche: ["911", "Cayenne", "Macan", "Panamera", "Taycan"],
  Skoda: ["Fabia", "Octavia", "Kodiaq", "Superb"],
  Tesla: ["Model 3", "Model Y", "Model S", "Model X"],
  Toyota: ["Corolla", "RAV4", "Yaris"],
  Volkswagen: ["Golf", "Passat", "Tiguan", "Touareg", "ID.4"],
  Volvo: ["XC40", "XC60", "V60"],
};

export const topBrands = [
  "Mercedes-Benz",
  "BMW",
  "Audi",
  "Volkswagen",
  "Porsche",
  "Ford",
  "Tesla",
  "Toyota",
  "Opel",
  "Skoda",
];

export const allBrands = Object.entries(brandLogoMap)
  .map(([name, file]) => ({
    logo: `/assets/car-brands/${file}`,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  }))
  .sort((left, right) => left.name.localeCompare(right.name));

export const fuelOptions: Array<SearchFilters["fuelType"] | ""> = ["", "Benzin", "Diesel", "Elektro", "Hybrid"];
export const transmissionOptions: Array<SearchFilters["transmission"] | ""> = ["", "Automatik", "Manuell"];
export const registrationOptions = ["", "2018", "2019", "2020", "2021", "2022", "2023", "2024"];
export const mileageOptions = ["", "5000", "10000", "20000", "40000", "60000", "80000", "120000"];
export const priceOptions = ["", "10000", "20000", "30000", "40000", "50000", "75000", "100000", "150000"];

export const demoVehicles: VehicleRecord[] = [
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
    image: "/assets/demo-vehicles/porsche-911-cabrio.jpg",
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
    make: "Mercedes-Benz",
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
  {
    id: "toyota-rav4",
    make: "Toyota",
    model: "RAV4",
    variant: "2.5 Hybrid Lounge",
    bodyType: "SUV",
    fuelType: "Hybrid",
    transmission: "Automatik",
    firstRegistration: "2023-05",
    mileageKm: 19000,
    powerHp: 222,
    priceGross: 41750,
    priceRating: "Fairer Preis",
    location: "Hamburg",
    dealerName: "Nord Cars",
    dealerCity: "20095 Hamburg",
    sellerType: "Haendler",
    description: "RAV4 Hybrid mit grossem Infotainment, Panoramadach und JBL Sound.",
    features: ["Hybrid", "Panorama", "JBL"],
    image: "/assets/mobile-de/family-car.webp",
    source: "market",
  },
  {
    id: "ford-mustang",
    make: "Ford",
    model: "Mustang",
    variant: "5.0 V8 GT Fastback",
    bodyType: "Coupe",
    fuelType: "Benzin",
    transmission: "Manuell",
    firstRegistration: "2021-04",
    mileageKm: 28000,
    powerHp: 450,
    priceGross: 52990,
    priceRating: "Top Preis",
    location: "Stuttgart",
    dealerName: "Garage Süd",
    dealerCity: "70173 Stuttgart",
    sellerType: "Haendler",
    description: "Mustang GT Fastback mit Performance Pack, Recaro und Klappenabgasanlage.",
    features: ["V8", "Performance Pack", "Recaro"],
    image: "/assets/vehicle-stock/coupe.svg",
    source: "market",
  },
];

export const emptySearchFilters: SearchFilters = {
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

export const emptyListingForm: ListingFormState = {
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

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("de-DE").format(value);
}

export function formatMonthYear(value: string) {
  const [year, month] = value.split("-");
  if (!year || !month) {
    return value;
  }

  return `${month}/${year}`;
}

export function makeSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseSearchFilters(raw: Record<string, string | string[] | undefined>): SearchFilters {
  const getValue = (key: keyof SearchFilters) => {
    const value = raw[key];
    return Array.isArray(value) ? value[0] ?? "" : value ?? "";
  };

  return {
    query: getValue("query"),
    make: getValue("make"),
    model: getValue("model"),
    firstRegistrationFrom: getValue("firstRegistrationFrom"),
    maxMileage: getValue("maxMileage"),
    minPrice: getValue("minPrice"),
    maxPrice: getValue("maxPrice"),
    postalCode: getValue("postalCode"),
    fuelType: getValue("fuelType") as SearchFilters["fuelType"],
    transmission: getValue("transmission") as SearchFilters["transmission"],
    electricOnly: getValue("electricOnly") === "true",
    paymentMode: (getValue("paymentMode") as PaymentMode) || "Kaufen",
  };
}

export function buildSearchHref(filters: SearchFilters) {
  const params = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(filters)) {
    if (typeof rawValue === "boolean") {
      if (rawValue) {
        params.set(key, "true");
      }
      continue;
    }

    if (rawValue) {
      params.set(key, rawValue);
    }
  }

  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}

export function getBrandLogo(make: string) {
  const brand = allBrands.find((entry) => entry.name === make);
  return brand?.logo ?? "/assets/mobile-de/logo-dark-de.webp";
}

export function filterVehicles(vehicles: VehicleRecord[], filters: SearchFilters) {
  const normalizedQuery = filters.query.trim().toLowerCase();
  const normalizedMake = filters.make.trim().toLowerCase();
  const maxMileage = filters.maxMileage ? Number(filters.maxMileage) : null;
  const maxPrice = filters.maxPrice ? Number(filters.maxPrice) : null;
  const minPrice = filters.minPrice ? Number(filters.minPrice) : null;
  const firstRegistrationFrom = filters.firstRegistrationFrom ? Number(filters.firstRegistrationFrom) : null;
  const normalizedPostal = filters.postalCode.trim().toLowerCase();

  return vehicles.filter((vehicle) => {
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
}

export function createListingRecord(listingForm: ListingFormState): VehicleRecord {
  return {
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
}
