import type { ProviderStatus, SellerType, Vehicle } from "@carvia/domain";

export interface VehicleSearchFilters {
  make?: string;
  model?: string;
  postalCode?: string;
  query?: string;
  firstRegistrationFrom?: string;
  mileageKmMax?: number;
  fuelType?: string;
  transmission?: string;
  purchasePriceMax?: number;
  minimumMargin?: number;
}

export interface ProviderHealth {
  provider: string;
  status: ProviderStatus;
  lastSyncAt?: string;
  importedVehicles?: number;
  message?: string;
}

export interface VehicleMarketplaceSearchFilters extends VehicleSearchFilters {
  page?: number;
  pageSize?: number;
  postalCode?: string;
  radiusKm?: number;
}

export interface VehicleMarketplaceProviderState {
  displayName: string;
  message: string;
  providerKey: string;
  status: "configured" | "disabled" | "error" | "mock";
}

export interface VehicleMarketplaceSearchPage {
  activeProviders: string[];
  currentPage: number;
  liveMode: boolean;
  pageSize: number;
  providerStates: VehicleMarketplaceProviderState[];
  totalItems: number;
  totalPages: number;
  vehicles: Vehicle[];
  warnings: string[];
}

export interface VehicleDataProvider {
  readonly providerKey: string;
  readonly displayName: string;

  searchVehicles(filters: VehicleSearchFilters): Promise<Vehicle[]>;
  getVehicle(id: string): Promise<Vehicle | null>;
  getTaxonomy(): Promise<Record<string, string[]>>;
  getPriceData(vehicle: Vehicle): Promise<Vehicle[]>;
  getHistoricalData(vehicleId: string): Promise<
    Array<{
      timestamp: string;
      price: number | null;
      mileageKm: number | null;
      status: string;
    }>
  >;
  healthCheck(): Promise<ProviderHealth>;
}

export interface DistanceProvider {
  readonly providerKey: string;
  estimateDistanceKm(input: {
    originPostalCode: string;
    destinationPostalCode: string;
    originCountry?: string;
    destinationCountry?: string;
  }): Promise<number>;
}

const mockImageByBodyType: Record<string, string> = {
  Convertible: "/assets/vehicle-stock/convertible.svg",
  Coupe: "/assets/vehicle-stock/coupe.svg",
  Hatchback: "/assets/vehicle-stock/hatchback.svg",
  Sedan: "/assets/vehicle-stock/sedan.svg",
  Sportback: "/assets/vehicle-stock/coupe.svg",
  SUV: "/assets/vehicle-stock/suv.svg",
  Wagon: "/assets/vehicle-stock/wagon.svg"
};

type MockVehicleSeed = {
  bodyType: string;
  color: string;
  country?: string;
  driveType: string;
  equipment: string[];
  exteriorColor: string;
  firstRegistration: string;
  fuelType: string;
  image?: string;
  interiorColor?: string;
  latitude: number;
  locationKey: string;
  longitude: number;
  make: string;
  mileageKm: number;
  model: string;
  modelGroup?: string;
  owners: number;
  postalCode: string;
  powerKw: number;
  priceGross: number;
  sellerId: string;
  transmission: string;
  trim?: string;
  variant: string;
};

function toHorsePower(powerKw: number) {
  return Math.round(powerKw * 1.35962);
}

function toEngineCapacityCc(powerKw: number, fuelType: string) {
  if (fuelType === "Electric") {
    return null;
  }

  if (fuelType === "Hybrid") {
    return 1998;
  }

  return powerKw >= 220 ? 2998 : powerKw >= 160 ? 1998 : 1498;
}

function buildMockVehicle(seed: MockVehicleSeed, index: number): Vehicle {
  const [year, month] = seed.firstRegistration.split("-");
  const createdAt = `2026-07-${String((index % 18) + 10).padStart(2, "0")}T09:00:00.000Z`;
  const updatedAt = `2026-08-${String((index % 6) + 1).padStart(2, "0")}T12:00:00.000Z`;
  const vehicleSlug = `${seed.make}-${seed.model}-${seed.variant}-${seed.postalCode}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const image = seed.image ?? mockImageByBodyType[seed.bodyType] ?? "/assets/mobile-de/family-car.webp";

  return {
    accidentFree: true,
    bodyType: seed.bodyType,
    condition: "Used",
    country: seed.country ?? "DE",
    createdAt,
    doors: seed.bodyType === "Convertible" || seed.bodyType === "Coupe" ? 2 : 5,
    driveType: seed.driveType,
    engineCapacityCc: toEngineCapacityCc(seed.powerKw, seed.fuelType),
    equipment: seed.equipment,
    exteriorColor: seed.exteriorColor,
    firstRegistration: seed.firstRegistration,
    firstSeenAt: createdAt,
    fuelType: seed.fuelType,
    generation: null,
    id: `mock-${vehicleSlug}-${index + 1}`,
    images: [image],
    inspectionValidUntil: `${Number(year) + 2}-${month}`,
    interiorColor: seed.interiorColor ?? "Black",
    lastSeenAt: updatedAt,
    latitude: seed.latitude,
    listingUrl: `https://example.com/mock/${vehicleSlug}`,
    longitude: seed.longitude,
    make: seed.make,
    mileageKm: seed.mileageKm,
    model: seed.model,
    modelGroup: seed.modelGroup ?? seed.model,
    owners: seed.owners,
    postalCode: seed.postalCode,
    powerHp: toHorsePower(seed.powerKw),
    powerKw: seed.powerKw,
    priceGross: seed.priceGross,
    priceNet: Math.round(seed.priceGross / 1.19),
    provider: "mock",
    providerVehicleId: `${vehicleSlug}-${index + 1}`,
    removedAt: null,
    seats: 5,
    sellerId: seed.sellerId,
    sellerType: "DEALER",
    transmission: seed.transmission,
    trim: seed.trim ?? seed.color,
    updatedAt,
    variant: seed.variant,
    vatType: "GROSS",
    vehicleType: "Car",
    vin: null
  };
}

const mockVehicleSeeds: MockVehicleSeed[] = [
  { make: "BMW", model: "3 Series", variant: "320d Touring", trim: "M Sport", bodyType: "Wagon", firstRegistration: "2022-04", mileageKm: 64000, fuelType: "Diesel", powerKw: 140, transmission: "Automatic", driveType: "Rear-Wheel Drive", exteriorColor: "Black", color: "Black", postalCode: "50667", latitude: 50.9375, longitude: 6.9603, priceGross: 31980, sellerId: "dealer-bmw-koeln", equipment: ["ACC", "LED", "Navi", "Kamera"], owners: 1, locationKey: "Koeln" },
  { make: "BMW", model: "3 Series", variant: "330e Touring", trim: "Luxury Line", bodyType: "Wagon", firstRegistration: "2023-01", mileageKm: 28000, fuelType: "Hybrid", powerKw: 215, transmission: "Automatic", driveType: "Rear-Wheel Drive", exteriorColor: "Blue", color: "Blue", postalCode: "40213", latitude: 51.2277, longitude: 6.7735, priceGross: 41200, sellerId: "dealer-bmw-duesseldorf", equipment: ["HUD", "ACC", "Panorama", "360 Kamera"], owners: 1, locationKey: "Duesseldorf" },
  { make: "BMW", model: "5 Series", variant: "520d", trim: "Business Paket", bodyType: "Sedan", firstRegistration: "2021-09", mileageKm: 79000, fuelType: "Diesel", powerKw: 140, transmission: "Automatic", driveType: "Rear-Wheel Drive", exteriorColor: "Grey", color: "Grey", postalCode: "60311", latitude: 50.1109, longitude: 8.6821, priceGross: 28990, sellerId: "dealer-bmw-frankfurt", equipment: ["LED", "Komfortsitze", "Navi", "PDC"], owners: 2, locationKey: "Frankfurt" },
  { make: "BMW", model: "X3", variant: "xDrive30e", trim: "xLine", bodyType: "SUV", firstRegistration: "2023-06", mileageKm: 34000, fuelType: "Hybrid", powerKw: 215, transmission: "Automatic", driveType: "All-Wheel Drive", exteriorColor: "White", color: "White", postalCode: "80331", latitude: 48.1371, longitude: 11.5754, priceGross: 46900, sellerId: "dealer-bmw-muenchen", equipment: ["Panorama", "ACC", "HK", "Matrix"], owners: 1, locationKey: "Muenchen" },
  { make: "Audi", model: "A4", variant: "40 TDI Avant", trim: "S line", bodyType: "Wagon", firstRegistration: "2022-05", mileageKm: 52000, fuelType: "Diesel", powerKw: 150, transmission: "Automatic", driveType: "Front-Wheel Drive", exteriorColor: "Silver", color: "Silver", postalCode: "70173", latitude: 48.7758, longitude: 9.1829, priceGross: 33450, sellerId: "dealer-audi-stuttgart", equipment: ["Matrix LED", "ACC", "Virtual Cockpit", "Kamera"], owners: 1, locationKey: "Stuttgart" },
  { make: "Audi", model: "A6", variant: "45 TFSI", trim: "S line", bodyType: "Sedan", firstRegistration: "2021-11", mileageKm: 61000, fuelType: "Petrol", powerKw: 195, transmission: "Automatic", driveType: "Front-Wheel Drive", exteriorColor: "Black", color: "Black", postalCode: "20095", latitude: 53.5511, longitude: 9.9937, priceGross: 38800, sellerId: "dealer-audi-hamburg", equipment: ["Leder", "HUD", "ACC", "Kamera"], owners: 2, locationKey: "Hamburg" },
  { make: "Audi", model: "Q5", variant: "50 TFSI e quattro", trim: "Advanced", bodyType: "SUV", firstRegistration: "2023-04", mileageKm: 37000, fuelType: "Hybrid", powerKw: 220, transmission: "Automatic", driveType: "All-Wheel Drive", exteriorColor: "Green", color: "Green", postalCode: "04109", latitude: 51.3397, longitude: 12.3731, priceGross: 45980, sellerId: "dealer-audi-leipzig", equipment: ["ACC", "Panorama", "Bang & Olufsen", "360 Kamera"], owners: 1, locationKey: "Leipzig" },
  { make: "Audi", model: "e-tron GT", variant: "quattro", trim: "Performance", bodyType: "Coupe", firstRegistration: "2022-09", mileageKm: 29000, fuelType: "Electric", powerKw: 350, transmission: "Automatic", driveType: "All-Wheel Drive", exteriorColor: "Grey", color: "Grey", postalCode: "28195", latitude: 53.0793, longitude: 8.8017, priceGross: 73800, sellerId: "dealer-audi-bremen", equipment: ["Luftfahrwerk", "ACC", "360 Kamera", "Laserlicht"], owners: 1, locationKey: "Bremen" },
  { make: "Mercedes-Benz", model: "C-Class", variant: "C 220 d T", trim: "AMG Line", bodyType: "Wagon", firstRegistration: "2022-07", mileageKm: 58000, fuelType: "Diesel", powerKw: 147, transmission: "Automatic", driveType: "Rear-Wheel Drive", exteriorColor: "White", color: "White", postalCode: "28195", latitude: 53.0793, longitude: 8.8017, priceGross: 36490, sellerId: "dealer-mercedes-bremen", equipment: ["Distronic", "LED", "Kamera", "Burmester"], owners: 1, locationKey: "Bremen" },
  { make: "Mercedes-Benz", model: "E-Class", variant: "E 300 de", trim: "Exclusive", bodyType: "Sedan", firstRegistration: "2023-03", mileageKm: 42000, fuelType: "Hybrid", powerKw: 230, transmission: "Automatic", driveType: "Rear-Wheel Drive", exteriorColor: "Black", color: "Black", postalCode: "50667", latitude: 50.9375, longitude: 6.9603, priceGross: 48200, sellerId: "dealer-mercedes-koeln", equipment: ["HUD", "Multibeam", "Leder", "ACC"], owners: 1, locationKey: "Koeln" },
  { make: "Mercedes-Benz", model: "GLC", variant: "300 4MATIC", trim: "AMG Line", bodyType: "SUV", firstRegistration: "2022-10", mileageKm: 51000, fuelType: "Petrol", powerKw: 190, transmission: "Automatic", driveType: "All-Wheel Drive", exteriorColor: "Blue", color: "Blue", postalCode: "90402", latitude: 49.4521, longitude: 11.0767, priceGross: 45890, sellerId: "dealer-mercedes-nuernberg", equipment: ["360 Kamera", "ACC", "Panorama", "Burmester"], owners: 1, locationKey: "Nuernberg" },
  { make: "Mercedes-Benz", model: "CLA", variant: "250 Shooting Brake", trim: "Progressive", bodyType: "Wagon", firstRegistration: "2021-05", mileageKm: 68000, fuelType: "Petrol", powerKw: 165, transmission: "Automatic", driveType: "Front-Wheel Drive", exteriorColor: "Red", color: "Red", postalCode: "01067", latitude: 51.0504, longitude: 13.7373, priceGross: 27950, sellerId: "dealer-mercedes-dresden", equipment: ["LED", "Apple CarPlay", "ACC", "PDC"], owners: 2, locationKey: "Dresden" },
  { make: "Volkswagen", model: "Golf", variant: "GTI Clubsport", trim: "Performance", bodyType: "Hatchback", firstRegistration: "2022-06", mileageKm: 41000, fuelType: "Petrol", powerKw: 221, transmission: "Automatic", driveType: "Front-Wheel Drive", exteriorColor: "Red", color: "Red", postalCode: "04109", latitude: 51.3397, longitude: 12.3731, priceGross: 33200, sellerId: "dealer-vw-leipzig", equipment: ["ACC", "Matrix LED", "HK", "Kamera"], owners: 2, locationKey: "Leipzig" },
  { make: "Volkswagen", model: "Passat", variant: "2.0 TDI Variant", trim: "Elegance", bodyType: "Wagon", firstRegistration: "2021-08", mileageKm: 87000, fuelType: "Diesel", powerKw: 147, transmission: "Automatic", driveType: "Front-Wheel Drive", exteriorColor: "Grey", color: "Grey", postalCode: "30159", latitude: 52.3759, longitude: 9.732, priceGross: 24990, sellerId: "dealer-vw-hannover", equipment: ["ACC", "IQ Light", "Navi", "Sitzheizung"], owners: 2, locationKey: "Hannover" },
  { make: "Volkswagen", model: "Tiguan", variant: "eHybrid DSG", trim: "R-Line", bodyType: "SUV", firstRegistration: "2023-02", mileageKm: 26000, fuelType: "Hybrid", powerKw: 180, transmission: "Automatic", driveType: "Front-Wheel Drive", exteriorColor: "White", color: "White", postalCode: "45127", latitude: 51.4556, longitude: 7.0116, priceGross: 39250, sellerId: "dealer-vw-essen", equipment: ["Panorama", "ACC", "Area View", "IQ Drive"], owners: 1, locationKey: "Essen" },
  { make: "Volkswagen", model: "ID.4", variant: "Pro Performance", trim: "Max", bodyType: "SUV", firstRegistration: "2022-12", mileageKm: 34000, fuelType: "Electric", powerKw: 150, transmission: "Automatic", driveType: "Rear-Wheel Drive", exteriorColor: "Blue", color: "Blue", postalCode: "60311", latitude: 50.1109, longitude: 8.6821, priceGross: 30890, sellerId: "dealer-vw-frankfurt", equipment: ["ACC", "Matrix", "360 Kamera", "Heat Pump"], owners: 1, locationKey: "Frankfurt" },
  { make: "Skoda", model: "Octavia", variant: "RS Combi", trim: "Challenge", bodyType: "Wagon", firstRegistration: "2022-09", mileageKm: 48000, fuelType: "Petrol", powerKw: 180, transmission: "Automatic", driveType: "Front-Wheel Drive", exteriorColor: "Green", color: "Green", postalCode: "50667", latitude: 50.9375, longitude: 6.9603, priceGross: 31990, sellerId: "dealer-skoda-koeln", equipment: ["ACC", "Matrix LED", "Canton", "Kamera"], owners: 1, locationKey: "Koeln" },
  { make: "Skoda", model: "Superb", variant: "2.0 TDI", trim: "L&K", bodyType: "Sedan", firstRegistration: "2021-06", mileageKm: 92000, fuelType: "Diesel", powerKw: 147, transmission: "Automatic", driveType: "Front-Wheel Drive", exteriorColor: "Silver", color: "Silver", postalCode: "53111", latitude: 50.7374, longitude: 7.0982, priceGross: 23980, sellerId: "dealer-skoda-bonn", equipment: ["Leder", "ACC", "Columbus", "Sitzklima"], owners: 2, locationKey: "Bonn" },
  { make: "Skoda", model: "Enyaq", variant: "80x", trim: "Sportline", bodyType: "SUV", firstRegistration: "2023-05", mileageKm: 23000, fuelType: "Electric", powerKw: 195, transmission: "Automatic", driveType: "All-Wheel Drive", exteriorColor: "Black", color: "Black", postalCode: "80331", latitude: 48.1371, longitude: 11.5754, priceGross: 41400, sellerId: "dealer-skoda-muenchen", equipment: ["ACC", "Travel Assist", "360 Kamera", "Panorama"], owners: 1, locationKey: "Muenchen" },
  { make: "Cupra", model: "Leon", variant: "2.0 TSI 4Drive", trim: "VZ", bodyType: "Hatchback", firstRegistration: "2022-03", mileageKm: 43000, fuelType: "Petrol", powerKw: 228, transmission: "Automatic", driveType: "All-Wheel Drive", exteriorColor: "Grey", color: "Grey", postalCode: "20095", latitude: 53.5511, longitude: 9.9937, priceGross: 31490, sellerId: "dealer-cupra-hamburg", equipment: ["ACC", "Matrix", "Beats", "Kamera"], owners: 1, locationKey: "Hamburg" },
  { make: "Cupra", model: "Formentor", variant: "e-Hybrid", trim: "VZ", bodyType: "SUV", firstRegistration: "2023-04", mileageKm: 26000, fuelType: "Hybrid", powerKw: 180, transmission: "Automatic", driveType: "Front-Wheel Drive", exteriorColor: "Blue", color: "Blue", postalCode: "28195", latitude: 53.0793, longitude: 8.8017, priceGross: 35800, sellerId: "dealer-cupra-bremen", equipment: ["Panorama", "ACC", "Top View", "Sennheiser"], owners: 1, locationKey: "Bremen" },
  { make: "Volvo", model: "V60", variant: "B4 Momentum", trim: "Business", bodyType: "Wagon", firstRegistration: "2022-08", mileageKm: 51000, fuelType: "Petrol", powerKw: 145, transmission: "Automatic", driveType: "Front-Wheel Drive", exteriorColor: "White", color: "White", postalCode: "22525", latitude: 53.5871, longitude: 9.9396, priceGross: 32900, sellerId: "dealer-volvo-hamburg", equipment: ["Pilot Assist", "LED", "Kamera", "Leder"], owners: 1, locationKey: "Hamburg" },
  { make: "Volvo", model: "XC60", variant: "Recharge T6", trim: "Ultimate", bodyType: "SUV", firstRegistration: "2023-01", mileageKm: 31000, fuelType: "Hybrid", powerKw: 257, transmission: "Automatic", driveType: "All-Wheel Drive", exteriorColor: "Silver", color: "Silver", postalCode: "30159", latitude: 52.3759, longitude: 9.732, priceGross: 49800, sellerId: "dealer-volvo-hannover", equipment: ["Bowers & Wilkins", "Panorama", "360 Kamera", "Pilot Assist"], owners: 1, locationKey: "Hannover" },
  { make: "Tesla", model: "Model 3", variant: "Long Range", trim: "Dual Motor", bodyType: "Sedan", firstRegistration: "2022-07", mileageKm: 47000, fuelType: "Electric", powerKw: 366, transmission: "Automatic", driveType: "All-Wheel Drive", exteriorColor: "White", color: "White", postalCode: "10407", latitude: 52.520, longitude: 13.405, priceGross: 32950, sellerId: "dealer-tesla-berlin", equipment: ["Autopilot", "Premium Audio", "Glasdach", "Wärmepumpe"], owners: 1, locationKey: "Berlin" },
  { make: "Tesla", model: "Model Y", variant: "Performance", trim: "Dual Motor", bodyType: "SUV", firstRegistration: "2023-03", mileageKm: 24000, fuelType: "Electric", powerKw: 393, transmission: "Automatic", driveType: "All-Wheel Drive", exteriorColor: "Black", color: "Black", postalCode: "01067", latitude: 51.0504, longitude: 13.7373, priceGross: 46990, sellerId: "dealer-tesla-dresden", equipment: ["Autopilot", "20 Zoll", "Glasdach", "Sitzheizung"], owners: 1, locationKey: "Dresden" },
  { make: "Hyundai", model: "IONIQ 5", variant: "77 kWh AWD", trim: "Techniq", bodyType: "SUV", firstRegistration: "2023-02", mileageKm: 29000, fuelType: "Electric", powerKw: 239, transmission: "Automatic", driveType: "All-Wheel Drive", exteriorColor: "Green", color: "Green", postalCode: "70173", latitude: 48.7758, longitude: 9.1829, priceGross: 38950, sellerId: "dealer-hyundai-stuttgart", equipment: ["HUD", "ACC", "360 Kamera", "V2L"], owners: 1, locationKey: "Stuttgart" },
  { make: "Hyundai", model: "Tucson", variant: "1.6 T-GDI Hybrid", trim: "Prime", bodyType: "SUV", firstRegistration: "2022-11", mileageKm: 41000, fuelType: "Hybrid", powerKw: 169, transmission: "Automatic", driveType: "Front-Wheel Drive", exteriorColor: "Grey", color: "Grey", postalCode: "90402", latitude: 49.4521, longitude: 11.0767, priceGross: 31480, sellerId: "dealer-hyundai-nuernberg", equipment: ["ACC", "Panorama", "360 Kamera", "Leder"], owners: 1, locationKey: "Nuernberg" },
  { make: "Toyota", model: "Corolla", variant: "2.0 Hybrid Touring", trim: "Team Deutschland", bodyType: "Wagon", firstRegistration: "2022-04", mileageKm: 54000, fuelType: "Hybrid", powerKw: 144, transmission: "Automatic", driveType: "Front-Wheel Drive", exteriorColor: "Blue", color: "Blue", postalCode: "45127", latitude: 51.4556, longitude: 7.0116, priceGross: 25400, sellerId: "dealer-toyota-essen", equipment: ["ACC", "LED", "Kamera", "Sitzheizung"], owners: 1, locationKey: "Essen" },
  { make: "Toyota", model: "RAV4", variant: "2.5 Hybrid AWD-i", trim: "Lounge", bodyType: "SUV", firstRegistration: "2023-05", mileageKm: 32000, fuelType: "Hybrid", powerKw: 163, transmission: "Automatic", driveType: "All-Wheel Drive", exteriorColor: "Red", color: "Red", postalCode: "60311", latitude: 50.1109, longitude: 8.6821, priceGross: 40950, sellerId: "dealer-toyota-frankfurt", equipment: ["360 Kamera", "ACC", "JBL", "Leder"], owners: 1, locationKey: "Frankfurt" },
  { make: "Porsche", model: "Taycan", variant: "4S", trim: "Performance Plus", bodyType: "Sedan", firstRegistration: "2022-10", mileageKm: 33000, fuelType: "Electric", powerKw: 390, transmission: "Automatic", driveType: "All-Wheel Drive", exteriorColor: "Black", color: "Black", postalCode: "80331", latitude: 48.1371, longitude: 11.5754, priceGross: 78900, sellerId: "dealer-porsche-muenchen", equipment: ["BOSE", "Luftfahrwerk", "ACC", "Panorama"], owners: 1, locationKey: "Muenchen" },
  { make: "Mazda", model: "MX-5", variant: "Skyactiv-G 184", trim: "Homura", bodyType: "Convertible", firstRegistration: "2021-06", mileageKm: 36000, fuelType: "Petrol", powerKw: 135, transmission: "Manual", driveType: "Rear-Wheel Drive", exteriorColor: "Red", color: "Red", postalCode: "50667", latitude: 50.9375, longitude: 6.9603, priceGross: 26950, sellerId: "dealer-mazda-koeln", equipment: ["Recaro", "LED", "Bose", "Kamera"], owners: 2, locationKey: "Koeln" }
];

const mockInventory: Vehicle[] = mockVehicleSeeds.map((seed, index) => buildMockVehicle(seed, index));

export function getMockVehicleInventory(): Vehicle[] {
  return mockInventory;
}

export class MockVehicleProvider implements VehicleDataProvider {
  readonly providerKey = "mock";
  readonly displayName = "Mock Provider";

  searchVehicles(filters: VehicleSearchFilters): Promise<Vehicle[]> {
    const vehicles = mockInventory.filter((vehicle) => {
      if (filters.make && vehicle.make !== filters.make) {
        return false;
      }

      if (
        filters.model &&
        !`${vehicle.model} ${vehicle.variant ?? ""}`.toLowerCase().includes(filters.model.toLowerCase())
      ) {
        return false;
      }

      if (
        filters.query &&
        !`${vehicle.make} ${vehicle.model} ${vehicle.variant ?? ""}`.toLowerCase().includes(filters.query.toLowerCase())
      ) {
        return false;
      }

      if (filters.fuelType && vehicle.fuelType !== filters.fuelType) {
        return false;
      }

      if (filters.transmission && vehicle.transmission !== filters.transmission) {
        return false;
      }

      if (filters.firstRegistrationFrom && vehicle.firstRegistration) {
        const normalized = `${filters.firstRegistrationFrom}-01`.slice(0, 7);
        if (vehicle.firstRegistration < normalized) {
          return false;
        }
      }

      if (filters.mileageKmMax && vehicle.mileageKm && vehicle.mileageKm > filters.mileageKmMax) {
        return false;
      }

      if (filters.purchasePriceMax && vehicle.priceGross && vehicle.priceGross > filters.purchasePriceMax) {
        return false;
      }

      if (filters.postalCode && vehicle.postalCode && !vehicle.postalCode.startsWith(filters.postalCode)) {
        return false;
      }

      return true;
    });

    return Promise.resolve(
      vehicles.sort((left, right) => (left.priceGross ?? Number.MAX_SAFE_INTEGER) - (right.priceGross ?? Number.MAX_SAFE_INTEGER))
    );
  }

  getVehicle(id: string): Promise<Vehicle | null> {
    return Promise.resolve(mockInventory.find((vehicle) => vehicle.id === id) ?? null);
  }

  getTaxonomy(): Promise<Record<string, string[]>> {
    const taxonomy = mockInventory.reduce<Record<string, Set<string>>>((accumulator, vehicle) => {
      if (!accumulator[vehicle.make]) {
        accumulator[vehicle.make] = new Set();
      }

      accumulator[vehicle.make].add(vehicle.model);
      return accumulator;
    }, {});

    return Promise.resolve(
      Object.fromEntries(
        Object.entries(taxonomy)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([make, models]) => [make, Array.from(models).sort((left, right) => left.localeCompare(right))])
      )
    );
  }

  getPriceData(vehicle: Vehicle): Promise<Vehicle[]> {
    return Promise.resolve(
      mockInventory.filter(
        (candidate) =>
          candidate.make === vehicle.make &&
          candidate.model === vehicle.model &&
          candidate.id !== vehicle.id
      )
    );
  }

  getHistoricalData(): Promise<
    Array<{
      timestamp: string;
      price: number | null;
      mileageKm: number | null;
      status: string;
    }>
  > {
    return Promise.resolve([]);
  }

  healthCheck(): Promise<ProviderHealth> {
    return Promise.resolve({
      provider: this.providerKey,
      status: "NOT_CONFIGURED",
      message: "Mock provider is available for local development."
    });
  }
}

export class MockDistanceProvider implements DistanceProvider {
  readonly providerKey = "mock-distance";

  estimateDistanceKm(): Promise<number> {
    return Promise.resolve(120);
  }
}

const MOBILE_DE_DEFAULT_BASE_URL = "https://services.mobile.de";
const AUTOSCOUT_DEFAULT_BASE_URL = "https://api.autoscout24.ch";
const AUTOSCOUT_DEFAULT_AUDIENCE = "https://api.autoscout24.ch";

const MOBILE_DE_FUEL_MAP: Record<string, string> = {
  Diesel: "DIESEL",
  Electric: "ELECTRICITY",
  Hybrid: "HYBRID",
  Petrol: "PETROL"
};

const MOBILE_DE_GEARBOX_MAP: Record<string, string> = {
  Automatic: "AUTOMATIC_GEAR",
  Manual: "MANUAL_GEAR"
};

const AUTOSCOUT_FUEL_MAP: Record<string, string> = {
  Diesel: "diesel",
  Electric: "electric",
  Hybrid: "hybrid",
  Petrol: "petrol"
};

const AUTOSCOUT_TRANSMISSION_GROUP_MAP: Record<string, string> = {
  Automatic: "automatic",
  Manual: "manual"
};

function readEnvValue(name: string) {
  const rawValue = process.env[name];

  if (typeof rawValue !== "string") {
    return undefined;
  }

  const trimmedValue = rawValue.trim();

  if (!trimmedValue || trimmedValue === '""' || trimmedValue === "''") {
    return undefined;
  }

  if (
    (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) ||
    (trimmedValue.startsWith("'") && trimmedValue.endsWith("'"))
  ) {
    const unquotedValue = trimmedValue.slice(1, -1).trim();
    return unquotedValue || undefined;
  }

  return trimmedValue;
}

type MobileDeSearchResponse = {
  ads?: Array<Record<string, unknown>>;
  currentPage?: number;
  errors?: Array<{ message?: string }>;
  maxPages?: number;
  pageSize?: number;
};

type AutoScoutTokenResponse = {
  access_token?: string;
};

type AutoScoutListingSearchResponse = {
  content?: Array<Record<string, unknown>>;
  number?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
};

type MarketplaceProviderClient = {
  displayName: string;
  providerKey: string;
  getTaxonomy(): Promise<Record<string, string[]>>;
  searchPage(filters: VehicleMarketplaceSearchFilters): Promise<VehicleMarketplaceSearchPage>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeYearMonth(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  if (/^\d{4}$/.test(value)) {
    return `${value}-01`;
  }

  if (/^\d{4}-\d{2}$/.test(value)) {
    return value;
  }

  return undefined;
}

function normalizeMarketplaceFilters(filters: VehicleMarketplaceSearchFilters) {
  return {
    ...filters,
    page: Math.max(1, filters.page ?? 1),
    pageSize: Math.max(1, Math.min(filters.pageSize ?? 20, 50)),
    radiusKm: Math.max(1, Math.min(filters.radiusKm ?? 50, 500))
  };
}

function createVehicleId(providerKey: string, providerVehicleId: string) {
  return `${providerKey}:${providerVehicleId}`;
}

function dedupeVehicles(vehicles: Vehicle[]) {
  const unique = new Map<string, Vehicle>();

  for (const vehicle of vehicles) {
    const key =
      vehicle.listingUrl ??
      `${vehicle.provider}:${vehicle.providerVehicleId ?? vehicle.id}:${vehicle.make}:${vehicle.model}:${vehicle.priceGross ?? "na"}`;

    if (!unique.has(key)) {
      unique.set(key, vehicle);
    }
  }

  return Array.from(unique.values());
}

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

function mapSellerType(value: string | null): SellerType | null {
  if (!value) {
    return null;
  }

  if (value === "DEALER") {
    return "DEALER";
  }

  if (value === "FOR_SALE_BY_OWNER" || value === "PRIVATE") {
    return "PRIVATE";
  }

  return null;
}

function mapMobileDeVehicle(ad: Record<string, unknown>): Vehicle | null {
  const seller = asRecord(ad.seller);
  const address = seller ? asRecord(seller.address) : null;
  const geoData = seller ? asRecord(seller.geoData) : null;
  const price = asRecord(ad.price);
  const images = ensureArray<Record<string, unknown>>(ad.images)
    .map((image) => asString(image.xl) ?? asString(image.l) ?? asString(image.m) ?? asString(image.s))
    .filter((value): value is string => Boolean(value));

  const providerVehicleId = asString(ad.mobileAdId);
  const listingUrl = asString(ad.detailPageUrl);

  if (!providerVehicleId || !listingUrl) {
    return null;
  }

  const firstRegistrationRaw = asString(ad.firstRegistration);
  const firstRegistration =
    firstRegistrationRaw && /^\d{6}$/.test(firstRegistrationRaw)
      ? `${firstRegistrationRaw.slice(0, 4)}-${firstRegistrationRaw.slice(4, 6)}`
      : null;

  return {
    accidentFree: null,
    bodyType: asString(ad.category),
    condition: asString(ad.condition),
    country: asString(address?.country),
    createdAt: asString(ad.creationDate) ?? new Date().toISOString(),
    doors: null,
    driveType: null,
    engineCapacityCc: null,
    equipment: [],
    exteriorColor: null,
    firstRegistration,
    firstSeenAt: asString(ad.creationDate),
    fuelType: asString(ad.fuel),
    generation: null,
    id: createVehicleId("mobile-de", providerVehicleId),
    images,
    inspectionValidUntil: null,
    interiorColor: null,
    lastSeenAt: asString(ad.modificationDate),
    latitude: asNumber(geoData?.lat),
    listingUrl,
    longitude: asNumber(geoData?.lon),
    make: asString(ad.make) ?? "Unknown",
    mileageKm: asNumber(ad.mileage),
    model: asString(ad.model) ?? "Unknown",
    modelGroup: null,
    owners: null,
    postalCode: asString(address?.zipcode),
    powerHp: null,
    powerKw: null,
    priceGross: asNumber(price?.consumerPriceGross),
    priceNet: asNumber(price?.dealerPriceNet),
    provider: "mobile-de",
    providerVehicleId,
    removedAt: null,
    seats: null,
    sellerId: asString(seller?.mobileSellerId),
    sellerType: mapSellerType(asString(seller?.type)),
    transmission: asString(ad.gearbox),
    trim: null,
    updatedAt: asString(ad.modificationDate) ?? new Date().toISOString(),
    variant: asString(ad.modelDescription),
    vatType: null,
    vehicleType: asString(ad.vehicleClass),
    vin: null
  };
}

function mapAutoScoutVehicle(listing: Record<string, unknown>): Vehicle | null {
  const make = asRecord(listing.make);
  const model = asRecord(listing.model);
  const seller = asRecord(listing.seller);
  const firstRegistrationDate = asRecord(listing.firstRegistrationDate);
  const providerVehicleId = asString(listing.id) ?? asString(listing.sellerVehicleId);
  const listingUrl = asString(listing.url);

  if (!providerVehicleId) {
    return null;
  }

  const firstRegistrationYear = asNumber(firstRegistrationDate?.year);
  const firstRegistrationMonth = asNumber(firstRegistrationDate?.month);
  const normalizedRegistration =
    firstRegistrationYear && firstRegistrationMonth
      ? `${String(firstRegistrationYear).padStart(4, "0")}-${String(firstRegistrationMonth).padStart(2, "0")}`
      : firstRegistrationYear
        ? `${String(firstRegistrationYear).padStart(4, "0")}-01`
        : null;

  return {
    accidentFree: null,
    bodyType: asString(listing.bodyType),
    condition: asString(listing.conditionType),
    country: asString(seller?.countryCode),
    createdAt: new Date().toISOString(),
    doors: asNumber(listing.doors),
    driveType: asString(listing.driveType),
    engineCapacityCc: asNumber(listing.cubicCapacity),
    equipment: [],
    exteriorColor: asString(listing.bodyColor),
    firstRegistration: normalizedRegistration,
    firstSeenAt: null,
    fuelType: asString(listing.fuelType),
    generation: null,
    id: createVehicleId("autoscout24", providerVehicleId),
    images: ensureArray<Record<string, unknown>>(listing.images)
      .map((image) => asString(image.url) ?? asString(image.lg) ?? asString(image.md))
      .filter((value): value is string => Boolean(value)),
    inspectionValidUntil: null,
    interiorColor: null,
    lastSeenAt: null,
    latitude: null,
    listingUrl,
    longitude: null,
    make: asString(make?.name) ?? asString(listing.makeName) ?? "Unknown",
    mileageKm: asNumber(listing.mileage),
    model: asString(model?.name) ?? asString(listing.modelName) ?? "Unknown",
    modelGroup: asString(listing.modelGroupKey),
    owners: null,
    postalCode: asString(seller?.zipCode),
    powerHp: asNumber(listing.horsePower),
    powerKw: asNumber(listing.kiloWatts),
    priceGross: asNumber(listing.price),
    priceNet: null,
    provider: "autoscout24",
    providerVehicleId,
    removedAt: null,
    seats: asNumber(listing.seats),
    sellerId: asString(seller?.id),
    sellerType: "DEALER",
    transmission: asString(listing.transmissionTypeGroup) ?? asString(listing.transmissionType),
    trim: null,
    updatedAt: new Date().toISOString(),
    variant: asString(listing.versionFullName) ?? asString(listing.teaser),
    vatType: null,
    vehicleType: asString(listing.vehicleCategory),
    vin: null
  };
}

class MobileDeMarketplaceProvider implements MarketplaceProviderClient {
  readonly displayName = "mobile.de";
  readonly providerKey = "mobile-de";

  constructor(
    private readonly config: {
      baseUrl: string;
      password: string;
      username: string;
    }
  ) {}

  private async request<T>(path: string, params?: URLSearchParams) {
    const url = new URL(path, this.config.baseUrl);

    if (params) {
      url.search = params.toString();
    }

    const authHeader = `Basic ${Buffer.from(`${this.config.username}:${this.config.password}`).toString("base64")}`;

    return fetchJson<T>(url.toString(), {
      headers: {
        Accept: "application/vnd.de.mobile.api+json",
        Authorization: authHeader
      }
    });
  }

  async getTaxonomy() {
    try {
      const response = await this.request<unknown>("/refdata/classes/Car/makes");
      const items = ensureArray<Record<string, unknown>>(
        asRecord(response)?.makes ?? asRecord(response)?.content ?? response
      );

      const taxonomy: Record<string, string[]> = {};

      for (const item of items) {
        const key = asString(item.key) ?? asString(item.name);

        if (key) {
          taxonomy[key] = [];
        }
      }

      return taxonomy;
    } catch {
      return {};
    }
  }

  async searchPage(filters: VehicleMarketplaceSearchFilters): Promise<VehicleMarketplaceSearchPage> {
    const normalized = normalizeMarketplaceFilters(filters);
    const params = new URLSearchParams({
      classification: "refdata/classes/Car",
      "imageCount.min": "1",
      "page.number": String(normalized.page),
      "page.size": String(normalized.pageSize),
      "sort.field": "modificationTime",
      "sort.order": "DESCENDING"
    });

    if (normalized.make) {
      params.set("classification", `refdata/classes/Car/makes/${normalized.make}`);
    }

    if (normalized.query) {
      params.set("modelDescription", normalized.query);
    }

    if (normalized.model) {
      params.set("modelDescription", normalized.model);
    }

    if (normalized.purchasePriceMax) {
      params.set("price.max", String(normalized.purchasePriceMax));
    }

    if (normalized.mileageKmMax) {
      params.set("mileage.max", String(normalized.mileageKmMax));
    }

    const firstRegistration = normalizeYearMonth(normalized.firstRegistrationFrom);

    if (firstRegistration) {
      params.set("firstRegistrationDate.min", firstRegistration);
    }

    if (normalized.fuelType && MOBILE_DE_FUEL_MAP[normalized.fuelType]) {
      params.set("fuel", MOBILE_DE_FUEL_MAP[normalized.fuelType]);
    }

    if (normalized.transmission && MOBILE_DE_GEARBOX_MAP[normalized.transmission]) {
      params.set("gearbox", MOBILE_DE_GEARBOX_MAP[normalized.transmission]);
    }

    if (normalized.postalCode) {
      params.set("ambit.zipcode", normalized.postalCode);
      params.set("ambit.radius", String(normalized.radiusKm));
    }

    const response = await this.request<MobileDeSearchResponse>("/search-api/search", params);
    const warnings = ensureArray<{ message?: string }>(response.errors).map(
      (entry) => entry.message ?? "mobile.de returned a search warning."
    );
    const vehicles = ensureArray<Record<string, unknown>>(response.ads)
      .map((entry) => mapMobileDeVehicle(entry))
      .filter((vehicle): vehicle is Vehicle => Boolean(vehicle));

    return {
      activeProviders: [this.providerKey],
      currentPage: response.currentPage ?? normalized.page,
      liveMode: true,
      pageSize: response.pageSize ?? normalized.pageSize,
      providerStates: [
        {
          displayName: this.displayName,
          message: "Offizielle mobile.de Search API",
          providerKey: this.providerKey,
          status: "configured"
        }
      ],
      totalItems: (response.maxPages ?? normalized.page) * (response.pageSize ?? normalized.pageSize),
      totalPages: Math.max(1, response.maxPages ?? normalized.page),
      vehicles,
      warnings
    };
  }
}

class AutoScout24MarketplaceProvider implements MarketplaceProviderClient {
  readonly displayName = "AutoScout24";
  readonly providerKey = "autoscout24";
  private accessToken: string | null = null;
  private accessTokenFetchedAt = 0;

  constructor(
    private readonly config: {
      audience: string;
      baseUrl: string;
      clientId: string;
      clientSecret: string;
    }
  ) {}

  private async getAccessToken() {
    const now = Date.now();

    if (this.accessToken && now - this.accessTokenFetchedAt < 50 * 60 * 1000) {
      return this.accessToken;
    }

    const body = new URLSearchParams({
      audience: this.config.audience,
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      grant_type: "client_credentials"
    });

    const response = await fetchJson<AutoScoutTokenResponse>(`${this.config.baseUrl}/public/v1/clients/oauth/token`, {
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      method: "POST"
    });

    if (!response.access_token) {
      throw new Error("AutoScout24 token response did not include access_token.");
    }

    this.accessToken = response.access_token;
    this.accessTokenFetchedAt = now;
    return response.access_token;
  }

  private async request<T>(path: string, init?: RequestInit) {
    const token = await this.getAccessToken();

    return fetchJson<T>(`${this.config.baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(init?.headers ?? {})
      }
    });
  }

  async getTaxonomy() {
    return {};
  }

  async searchPage(filters: VehicleMarketplaceSearchFilters): Promise<VehicleMarketplaceSearchPage> {
    const normalized = normalizeMarketplaceFilters(filters);
    const query: Record<string, unknown> = {
      conditionTypes: ["used", "new"],
      vehicleCategories: ["car"]
    };

    if (normalized.firstRegistrationFrom && /^\d{4}/.test(normalized.firstRegistrationFrom)) {
      query.firstRegistrationYearFrom = Number(normalized.firstRegistrationFrom.slice(0, 4));
    }

    if (normalized.fuelType && AUTOSCOUT_FUEL_MAP[normalized.fuelType]) {
      query.fuelTypes = [AUTOSCOUT_FUEL_MAP[normalized.fuelType]];
    }

    if (normalized.transmission && AUTOSCOUT_TRANSMISSION_GROUP_MAP[normalized.transmission]) {
      query.transmissionTypeGroups = [AUTOSCOUT_TRANSMISSION_GROUP_MAP[normalized.transmission]];
    }

    if (normalized.mileageKmMax) {
      query.mileageTo = normalized.mileageKmMax;
    }

    if (normalized.purchasePriceMax) {
      query.priceTo = normalized.purchasePriceMax;
    }

    if (normalized.make) {
      query.makeModelVersions = [
        {
          makeKey: normalized.make.toLowerCase(),
          modelKey: normalized.model ? normalized.model.toLowerCase().replaceAll(" ", "-") : undefined
        }
      ];
    }

    const response = await this.request<AutoScoutListingSearchResponse>("/public/v1/listings/search", {
      body: JSON.stringify({
        pagination: {
          page: Math.max(0, normalized.page - 1),
          size: normalized.pageSize
        },
        query,
        sort: [{ order: "ASC", type: "PRICE" }]
      }),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });

    const vehicles = ensureArray<Record<string, unknown>>(response.content)
      .map((entry) => mapAutoScoutVehicle(entry))
      .filter((vehicle): vehicle is Vehicle => Boolean(vehicle));

    return {
      activeProviders: [this.providerKey],
      currentPage: (response.number ?? 0) + 1,
      liveMode: true,
      pageSize: response.size ?? normalized.pageSize,
      providerStates: [
        {
          displayName: this.displayName,
          message: "Offizielle AutoScout24 Developer API",
          providerKey: this.providerKey,
          status: "configured"
        }
      ],
      totalItems: response.totalElements ?? vehicles.length,
      totalPages: Math.max(1, response.totalPages ?? 1),
      vehicles,
      warnings: []
    };
  }
}

function getConfiguredMarketplaceProviders() {
  const providers: MarketplaceProviderClient[] = [];
  const providerStates: VehicleMarketplaceProviderState[] = [];
  const mobileApiEnabled = readEnvValue("MOBILE_API_ENABLED") === "true";
  const mobileApiUsername = readEnvValue("MOBILE_API_USERNAME");
  const mobileApiPassword = readEnvValue("MOBILE_API_PASSWORD");
  const mobileApiBaseUrl = readEnvValue("MOBILE_API_BASE_URL") ?? MOBILE_DE_DEFAULT_BASE_URL;
  const autoScoutApiEnabled = readEnvValue("AUTOSCOUT_API_ENABLED") === "true";
  const autoScoutApiBaseUrl = readEnvValue("AUTOSCOUT_API_BASE_URL") ?? AUTOSCOUT_DEFAULT_BASE_URL;
  const autoScoutApiAudience = readEnvValue("AUTOSCOUT_API_AUDIENCE") ?? AUTOSCOUT_DEFAULT_AUDIENCE;
  const autoScoutApiClientId = readEnvValue("AUTOSCOUT_API_CLIENT_ID");
  const autoScoutApiClientSecret = readEnvValue("AUTOSCOUT_API_CLIENT_SECRET");

  if (mobileApiEnabled && mobileApiUsername && mobileApiPassword) {
    providers.push(
      new MobileDeMarketplaceProvider({
        baseUrl: mobileApiBaseUrl,
        password: mobileApiPassword,
        username: mobileApiUsername
      })
    );
    providerStates.push({
      displayName: "mobile.de",
      message: "mobile.de Zugangsdaten sind in der Laufzeitumgebung vorhanden.",
      providerKey: "mobile-de",
      status: "configured"
    });
  } else {
    providerStates.push({
      displayName: "mobile.de",
      message: "mobile.de Zugangsdaten fehlen oder die API ist deaktiviert.",
      providerKey: "mobile-de",
      status: "disabled"
    });
  }

  if (autoScoutApiEnabled && autoScoutApiClientId && autoScoutApiClientSecret) {
    providers.push(
      new AutoScout24MarketplaceProvider({
        audience: autoScoutApiAudience,
        baseUrl: autoScoutApiBaseUrl,
        clientId: autoScoutApiClientId,
        clientSecret: autoScoutApiClientSecret
      })
    );
    providerStates.push({
      displayName: "AutoScout24",
      message: "AutoScout24 Zugangsdaten sind in der Laufzeitumgebung vorhanden.",
      providerKey: "autoscout24",
      status: "configured"
    });
  } else {
    providerStates.push({
      displayName: "AutoScout24",
      message: "AutoScout24 Zugangsdaten fehlen oder die API ist deaktiviert.",
      providerKey: "autoscout24",
      status: "disabled"
    });
  }

  return { providerStates, providers };
}

export function getMarketplaceProviderRuntimeStates() {
  return getConfiguredMarketplaceProviders().providerStates;
}

export async function getMarketplaceTaxonomy() {
  const { providers } = getConfiguredMarketplaceProviders();

  for (const provider of providers) {
    try {
      const taxonomy = await provider.getTaxonomy();

      if (Object.keys(taxonomy).length > 0) {
        return taxonomy;
      }
    } catch {
      continue;
    }
  }

  return new MockVehicleProvider().getTaxonomy();
}

export async function searchMarketplaceVehicles(
  filters: VehicleMarketplaceSearchFilters
): Promise<VehicleMarketplaceSearchPage> {
  const normalized = normalizeMarketplaceFilters(filters);
  const { providers, providerStates } = getConfiguredMarketplaceProviders();

  if (providers.length === 0) {
    const mockProvider = new MockVehicleProvider();
    const vehicles = await mockProvider.searchVehicles(normalized);
    const offset = (normalized.page - 1) * normalized.pageSize;
    const pagedVehicles = vehicles.slice(offset, offset + normalized.pageSize);

    return {
      activeProviders: ["mock"],
      currentPage: normalized.page,
      liveMode: false,
      pageSize: normalized.pageSize,
      providerStates: [
        ...providerStates,
        {
          displayName: "Mock Vehicle Feed",
          message: "Das Demo-Inventar ist aktiv, bis offizielle API-Zugangsdaten korrekt eingerichtet sind.",
          providerKey: "mock",
          status: "mock"
        }
      ],
      totalItems: vehicles.length,
      totalPages: Math.max(1, Math.ceil(vehicles.length / normalized.pageSize)),
      vehicles: pagedVehicles,
      warnings: [
        "Live-Marktplatz-Zugangsdaten sind noch nicht vollstaendig eingerichtet. Carvia nutzt aktuell das lokale Demo-Inventar."
      ]
    };
  }

  const results = await Promise.allSettled(providers.map((provider) => provider.searchPage(normalized)));
  const successfulPages = results
    .filter((result): result is PromiseFulfilledResult<VehicleMarketplaceSearchPage> => result.status === "fulfilled")
    .map((result) => result.value);
  const failedPages = results
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => result.reason);

  if (successfulPages.length === 0) {
    const mockProvider = new MockVehicleProvider();
    const vehicles = await mockProvider.searchVehicles(normalized);
    const offset = (normalized.page - 1) * normalized.pageSize;

    return {
      activeProviders: ["mock"],
      currentPage: normalized.page,
      liveMode: false,
      pageSize: normalized.pageSize,
      providerStates: [
        ...providerStates.map((state) => ({
          ...state,
          message:
            state.status === "configured"
              ? "Die Laufzeit-Konfiguration ist vorhanden, aber die letzte Live-Suchanfrage ist fehlgeschlagen."
              : state.message,
          status: state.status === "configured" ? "error" : state.status
        })),
        {
          displayName: "Mock Vehicle Feed",
          message: "Live-Anfragen sind fehlgeschlagen. Carvia faellt auf das Demo-Inventar zurueck.",
          providerKey: "mock",
          status: "mock"
        }
      ],
      totalItems: vehicles.length,
      totalPages: Math.max(1, Math.ceil(vehicles.length / normalized.pageSize)),
      vehicles: vehicles.slice(offset, offset + normalized.pageSize),
      warnings: [
        ...failedPages.map((error) => `Live-Provider-Anfrage fehlgeschlagen: ${error instanceof Error ? error.message : "unbekannter Fehler"}`),
        "Es werden Demo-Fahrzeuge angezeigt, weil kein Live-Provider verwertbare Daten geliefert hat."
      ]
    };
  }

  const aggregatedVehicles = dedupeVehicles(successfulPages.flatMap((page) => page.vehicles)).sort((left, right) => {
    const leftPrice = left.priceGross ?? Number.MAX_SAFE_INTEGER;
    const rightPrice = right.priceGross ?? Number.MAX_SAFE_INTEGER;
    return leftPrice - rightPrice;
  });

  const totalItems = successfulPages.reduce((sum, page) => sum + page.totalItems, 0);
  const totalPages = Math.max(...successfulPages.map((page) => page.totalPages), 1);
  const currentPage = successfulPages[0]?.currentPage ?? normalized.page;

  return {
    activeProviders: successfulPages.flatMap((page) => page.activeProviders),
    currentPage,
    liveMode: true,
    pageSize: normalized.pageSize,
    providerStates,
    totalItems,
    totalPages,
    vehicles: aggregatedVehicles,
    warnings: [
      ...successfulPages.flatMap((page) => page.warnings),
      ...failedPages.map((error) => `Ein Live-Provider konnte nicht abgefragt werden: ${error instanceof Error ? error.message : "unbekannter Fehler"}`),
      ...(successfulPages.length > 1 ? ["Die kombinierte Pagination mehrerer Live-Provider ist noch naeherungsweise, bis alle Datenquellen vollstaendig normalisiert sind."] : [])
    ]
  };
}
