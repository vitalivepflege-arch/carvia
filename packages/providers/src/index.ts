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

export class MockVehicleProvider implements VehicleDataProvider {
  readonly providerKey = "mock";
  readonly displayName = "Mock Provider";

  searchVehicles(): Promise<Vehicle[]> {
    return Promise.resolve([]);
  }

  getVehicle(): Promise<Vehicle | null> {
    return Promise.resolve(null);
  }

  getTaxonomy(): Promise<Record<string, string[]>> {
    return Promise.resolve({
      BMW: ["3 Series", "5 Series", "X3"],
      "Mercedes-Benz": ["C-Class", "E-Class", "GLC"],
      Audi: ["A4", "A6", "Q5"]
    });
  }

  getPriceData(): Promise<Vehicle[]> {
    return Promise.resolve([]);
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
