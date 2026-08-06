import { z } from "zod";

export const vatTypeSchema = z.enum(["GROSS", "NET", "DIFFERENTIAL"]);
export const sellerTypeSchema = z.enum([
  "DEALER",
  "PRIVATE",
  "AUCTION",
  "FLEET",
  "LEASING",
  "OEM",
  "RENTAL"
]);

export const providerStatusSchema = z.enum([
  "CONNECTED",
  "NOT_CONFIGURED",
  "DISABLED",
  "ERROR"
]);

export const vehicleSchema = z.object({
  id: z.string(),
  provider: z.string(),
  providerVehicleId: z.string().nullable(),
  vin: z.string().nullable(),
  make: z.string(),
  model: z.string(),
  modelGroup: z.string().nullable(),
  generation: z.string().nullable(),
  variant: z.string().nullable(),
  trim: z.string().nullable(),
  vehicleType: z.string().nullable(),
  bodyType: z.string().nullable(),
  firstRegistration: z.string().nullable(),
  mileageKm: z.number().int().nonnegative().nullable(),
  fuelType: z.string().nullable(),
  powerKw: z.number().int().nonnegative().nullable(),
  powerHp: z.number().int().nonnegative().nullable(),
  engineCapacityCc: z.number().int().nonnegative().nullable(),
  transmission: z.string().nullable(),
  driveType: z.string().nullable(),
  doors: z.number().int().positive().nullable(),
  seats: z.number().int().positive().nullable(),
  exteriorColor: z.string().nullable(),
  interiorColor: z.string().nullable(),
  condition: z.string().nullable(),
  accidentFree: z.boolean().nullable(),
  owners: z.number().int().nonnegative().nullable(),
  inspectionValidUntil: z.string().nullable(),
  country: z.string().nullable(),
  postalCode: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  priceGross: z.number().nonnegative().nullable(),
  priceNet: z.number().nonnegative().nullable(),
  vatType: vatTypeSchema.nullable(),
  sellerType: sellerTypeSchema.nullable(),
  sellerId: z.string().nullable(),
  equipment: z.array(z.string()),
  images: z.array(z.string()),
  listingUrl: z.string().url().nullable(),
  firstSeenAt: z.string().nullable(),
  lastSeenAt: z.string().nullable(),
  removedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const analysisInputsSchema = z.object({
  purchasePrice: z.number().nonnegative(),
  transportCost: z.number().nonnegative().default(0),
  preparationCost: z.number().nonnegative().default(0),
  repairCost: z.number().nonnegative().default(0),
  auctionFee: z.number().nonnegative().default(0),
  financingCost: z.number().nonnegative().default(0),
  otherCost: z.number().nonnegative().default(0)
});

export const marketSummarySchema = z.object({
  comparableCount: z.number().int().nonnegative(),
  minimum: z.number().nonnegative().nullable(),
  percentile25: z.number().nonnegative().nullable(),
  median: z.number().nonnegative().nullable(),
  percentile75: z.number().nonnegative().nullable(),
  maximum: z.number().nonnegative().nullable(),
  trimmedMean: z.number().nonnegative().nullable()
});

export const dealerScoreBreakdownSchema = z.object({
  marginScore: z.number().min(0).max(100),
  marketPriceScore: z.number().min(0).max(100),
  demandScore: z.number().min(0).max(100),
  liquidityScore: z.number().min(0).max(100),
  riskScore: z.number().min(0).max(100),
  confidenceScore: z.number().min(0).max(100),
  overallScore: z.number().min(0).max(100)
});

export const importVehicleRowSchema = z.object({
  firstRegistration: z.string().min(7).max(7).nullable(),
  fuelType: z.string().min(3).nullable(),
  listingUrl: z.string().url().nullable(),
  make: z.string().min(2),
  mileageKm: z.number().int().nonnegative().nullable(),
  model: z.string().min(1),
  postalCode: z.string().nullable(),
  powerHp: z.number().int().nonnegative().nullable(),
  priceGross: z.number().nonnegative().nullable(),
  providerVehicleId: z.string().min(1),
  transmission: z.string().nullable(),
  variant: z.string().nullable()
});

export type AnalysisInputs = z.infer<typeof analysisInputsSchema>;
export type DealerScoreBreakdown = z.infer<typeof dealerScoreBreakdownSchema>;
export type ImportVehicleRow = z.infer<typeof importVehicleRowSchema>;
export type MarketSummary = z.infer<typeof marketSummarySchema>;
export type ProviderStatus = z.infer<typeof providerStatusSchema>;
export type SellerType = z.infer<typeof sellerTypeSchema>;
export type VatType = z.infer<typeof vatTypeSchema>;
export type Vehicle = z.infer<typeof vehicleSchema>;

export interface ComparableVehicleResult {
  vehicle: Vehicle;
  similarityScore: number;
}

export interface PriceAnalysisService {
  summarizeMarket(comparables: ComparableVehicleResult[]): Promise<MarketSummary>;
}

export interface MarginAnalysisService {
  calculateProjectedMargin(
    inputs: AnalysisInputs,
    estimatedTransactionPrice: number
  ): Promise<{
    totalLandedCost: number;
    projectedGrossMargin: number;
    projectedMarginPercent: number;
  }>;
}

export interface DealerScoreService {
  scoreDeal(input: {
    margin: number;
    confidence: number;
    demand: number;
    liquidity: number;
    risk: number;
    marketPosition: number;
  }): Promise<DealerScoreBreakdown>;
}
