import type { ProviderStatus, Vehicle } from "@carvia/domain";

export interface VehicleSearchFilters {
  make?: string;
  model?: string;
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

const mockInventory: Vehicle[] = [
  {
    id: "mock-bmw-m340i-2023-1",
    provider: "mock",
    providerVehicleId: "m340i-1",
    vin: null,
    make: "BMW",
    model: "3 Series",
    modelGroup: "3 Series",
    generation: "G20",
    variant: "M340i xDrive",
    trim: "M Sport",
    vehicleType: "Car",
    bodyType: "Sedan",
    firstRegistration: "2023-03",
    mileageKm: 38000,
    fuelType: "Petrol",
    powerKw: 275,
    powerHp: 374,
    engineCapacityCc: 2998,
    transmission: "Automatic",
    driveType: "All-Wheel Drive",
    doors: 4,
    seats: 5,
    exteriorColor: "Black",
    interiorColor: "Black",
    condition: "Used",
    accidentFree: true,
    owners: 1,
    inspectionValidUntil: "2027-03",
    country: "DE",
    postalCode: "80331",
    latitude: 48.1371,
    longitude: 11.5754,
    priceGross: 48490,
    priceNet: 40747,
    vatType: "GROSS",
    sellerType: "DEALER",
    sellerId: "dealer-bmw-1",
    equipment: ["Head-up Display", "ACC", "LED", "Camera"],
    images: [],
    listingUrl: "https://example.com/mock/bmw-m340i-1",
    firstSeenAt: "2026-08-01T10:00:00.000Z",
    lastSeenAt: "2026-08-05T10:00:00.000Z",
    removedAt: null,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-05T10:00:00.000Z"
  },
  {
    id: "mock-bmw-m340i-2023-2",
    provider: "mock",
    providerVehicleId: "m340i-2",
    vin: null,
    make: "BMW",
    model: "3 Series",
    modelGroup: "3 Series",
    generation: "G20",
    variant: "M340i xDrive",
    trim: "M Sport Pro",
    vehicleType: "Car",
    bodyType: "Sedan",
    firstRegistration: "2023-05",
    mileageKm: 42000,
    fuelType: "Petrol",
    powerKw: 275,
    powerHp: 374,
    engineCapacityCc: 2998,
    transmission: "Automatic",
    driveType: "All-Wheel Drive",
    doors: 4,
    seats: 5,
    exteriorColor: "Grey",
    interiorColor: "Black",
    condition: "Used",
    accidentFree: true,
    owners: 1,
    inspectionValidUntil: "2027-05",
    country: "DE",
    postalCode: "50667",
    latitude: 50.9375,
    longitude: 6.9603,
    priceGross: 47200,
    priceNet: 39664,
    vatType: "GROSS",
    sellerType: "DEALER",
    sellerId: "dealer-bmw-2",
    equipment: ["Panorama", "ACC", "360 Camera", "HK"],
    images: [],
    listingUrl: "https://example.com/mock/bmw-m340i-2",
    firstSeenAt: "2026-07-30T10:00:00.000Z",
    lastSeenAt: "2026-08-05T10:00:00.000Z",
    removedAt: null,
    createdAt: "2026-07-30T10:00:00.000Z",
    updatedAt: "2026-08-05T10:00:00.000Z"
  },
  {
    id: "mock-bmw-330i-2022-1",
    provider: "mock",
    providerVehicleId: "330i-1",
    vin: null,
    make: "BMW",
    model: "3 Series",
    modelGroup: "3 Series",
    generation: "G20",
    variant: "330i",
    trim: "M Sport",
    vehicleType: "Car",
    bodyType: "Sedan",
    firstRegistration: "2022-08",
    mileageKm: 55000,
    fuelType: "Petrol",
    powerKw: 180,
    powerHp: 245,
    engineCapacityCc: 1998,
    transmission: "Automatic",
    driveType: "Rear-Wheel Drive",
    doors: 4,
    seats: 5,
    exteriorColor: "Blue",
    interiorColor: "Black",
    condition: "Used",
    accidentFree: true,
    owners: 2,
    inspectionValidUntil: "2026-08",
    country: "DE",
    postalCode: "40213",
    latitude: 51.2277,
    longitude: 6.7735,
    priceGross: 35900,
    priceNet: 30168,
    vatType: "GROSS",
    sellerType: "DEALER",
    sellerId: "dealer-bmw-3",
    equipment: ["LED", "ACC", "PDC"],
    images: [],
    listingUrl: "https://example.com/mock/bmw-330i-1",
    firstSeenAt: "2026-07-29T10:00:00.000Z",
    lastSeenAt: "2026-08-05T10:00:00.000Z",
    removedAt: null,
    createdAt: "2026-07-29T10:00:00.000Z",
    updatedAt: "2026-08-05T10:00:00.000Z"
  },
  {
    id: "mock-mercedes-c300e-2023-1",
    provider: "mock",
    providerVehicleId: "c300e-1",
    vin: null,
    make: "Mercedes-Benz",
    model: "C-Class",
    modelGroup: "C-Class",
    generation: "W206",
    variant: "C300e",
    trim: "AMG Line",
    vehicleType: "Car",
    bodyType: "Sedan",
    firstRegistration: "2023-02",
    mileageKm: 31000,
    fuelType: "Hybrid",
    powerKw: 230,
    powerHp: 313,
    engineCapacityCc: 1999,
    transmission: "Automatic",
    driveType: "Rear-Wheel Drive",
    doors: 4,
    seats: 5,
    exteriorColor: "Silver",
    interiorColor: "Black",
    condition: "Used",
    accidentFree: true,
    owners: 1,
    inspectionValidUntil: "2027-02",
    country: "DE",
    postalCode: "70173",
    latitude: 48.7758,
    longitude: 9.1829,
    priceGross: 44900,
    priceNet: 37731,
    vatType: "GROSS",
    sellerType: "DEALER",
    sellerId: "dealer-mercedes-1",
    equipment: ["Burmester", "HUD", "ACC"],
    images: [],
    listingUrl: "https://example.com/mock/mercedes-c300e-1",
    firstSeenAt: "2026-08-01T09:00:00.000Z",
    lastSeenAt: "2026-08-05T09:00:00.000Z",
    removedAt: null,
    createdAt: "2026-08-01T09:00:00.000Z",
    updatedAt: "2026-08-05T09:00:00.000Z"
  },
  {
    id: "mock-audi-s5-2022-1",
    provider: "mock",
    providerVehicleId: "s5-1",
    vin: null,
    make: "Audi",
    model: "A5",
    modelGroup: "A5",
    generation: "F5",
    variant: "S5 TDI Quattro",
    trim: "Sportback",
    vehicleType: "Car",
    bodyType: "Sportback",
    firstRegistration: "2022-11",
    mileageKm: 47000,
    fuelType: "Diesel",
    powerKw: 251,
    powerHp: 341,
    engineCapacityCc: 2967,
    transmission: "Automatic",
    driveType: "All-Wheel Drive",
    doors: 5,
    seats: 5,
    exteriorColor: "White",
    interiorColor: "Black",
    condition: "Used",
    accidentFree: true,
    owners: 1,
    inspectionValidUntil: "2026-11",
    country: "DE",
    postalCode: "20095",
    latitude: 53.5511,
    longitude: 9.9937,
    priceGross: 51100,
    priceNet: 42941,
    vatType: "GROSS",
    sellerType: "DEALER",
    sellerId: "dealer-audi-1",
    equipment: ["Matrix LED", "ACC", "Camera"],
    images: [],
    listingUrl: "https://example.com/mock/audi-s5-1",
    firstSeenAt: "2026-08-02T10:00:00.000Z",
    lastSeenAt: "2026-08-05T10:00:00.000Z",
    removedAt: null,
    createdAt: "2026-08-02T10:00:00.000Z",
    updatedAt: "2026-08-05T10:00:00.000Z"
  },
  {
    id: "mock-vw-golf-gti-2022-1",
    provider: "mock",
    providerVehicleId: "gti-1",
    vin: null,
    make: "Volkswagen",
    model: "Golf",
    modelGroup: "Golf",
    generation: "Mk8",
    variant: "GTI Clubsport",
    trim: "Performance",
    vehicleType: "Car",
    bodyType: "Hatchback",
    firstRegistration: "2022-06",
    mileageKm: 41000,
    fuelType: "Petrol",
    powerKw: 221,
    powerHp: 300,
    engineCapacityCc: 1984,
    transmission: "Automatic",
    driveType: "Front-Wheel Drive",
    doors: 5,
    seats: 5,
    exteriorColor: "Red",
    interiorColor: "Black",
    condition: "Used",
    accidentFree: true,
    owners: 2,
    inspectionValidUntil: "2026-06",
    country: "DE",
    postalCode: "04109",
    latitude: 51.3397,
    longitude: 12.3731,
    priceGross: 33200,
    priceNet: 27899,
    vatType: "GROSS",
    sellerType: "DEALER",
    sellerId: "dealer-vw-1",
    equipment: ["ACC", "Matrix LED", "HK"],
    images: [],
    listingUrl: "https://example.com/mock/golf-gti-1",
    firstSeenAt: "2026-08-02T12:00:00.000Z",
    lastSeenAt: "2026-08-05T12:00:00.000Z",
    removedAt: null,
    createdAt: "2026-08-02T12:00:00.000Z",
    updatedAt: "2026-08-05T12:00:00.000Z"
  }
];

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

      if (filters.model && vehicle.model !== filters.model) {
        return false;
      }

      if (filters.fuelType && vehicle.fuelType !== filters.fuelType) {
        return false;
      }

      if (filters.transmission && vehicle.transmission !== filters.transmission) {
        return false;
      }

      if (
        filters.purchasePriceMax &&
        vehicle.priceGross &&
        vehicle.priceGross > filters.purchasePriceMax * 1.45
      ) {
        return false;
      }

      return true;
    });

    return Promise.resolve(vehicles);
  }

  getVehicle(id: string): Promise<Vehicle | null> {
    return Promise.resolve(mockInventory.find((vehicle) => vehicle.id === id) ?? null);
  }

  getTaxonomy(): Promise<Record<string, string[]>> {
    return Promise.resolve({
      BMW: ["3 Series", "5 Series", "X3"],
      "Mercedes-Benz": ["C-Class", "E-Class", "GLC"],
      Audi: ["A4", "A6", "Q5"]
    });
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
