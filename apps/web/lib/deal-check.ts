import { MockVehicleProvider } from "@carvia/providers";
import {
  buildDealerScoreBreakdown,
  buildRiskFactors,
  calculateProjectedMargin,
  deriveDemandScore,
  deriveLiquidityScore,
  deriveRiskScore,
  summarizeMarket
} from "./analysis-services";

const mockProvider = new MockVehicleProvider();

export type DealCheckInput = {
  auctionFee: number;
  firstRegistration: string;
  fuelType: string;
  make: string;
  mileageKm: number;
  model: string;
  otherCost: number;
  powerHp: number;
  preparationCost: number;
  purchasePrice: number;
  repairCost: number;
  transmission: string;
  transportCost: number;
  variant: string;
};

export async function getDealCheckTaxonomy() {
  return mockProvider.getTaxonomy();
}

export async function analyzeDeal(input: DealCheckInput) {
  const targetVehicle = {
    id: `analysis-${input.make}-${input.model}-${input.firstRegistration}`,
    provider: "manual",
    providerVehicleId: null,
    vin: null,
    make: input.make,
    model: input.model,
    modelGroup: input.model,
    generation: null,
    variant: input.variant || null,
    trim: null,
    vehicleType: "Car",
    bodyType: null,
    firstRegistration: input.firstRegistration,
    mileageKm: input.mileageKm,
    fuelType: input.fuelType,
    powerKw: Math.round(input.powerHp * 0.7355),
    powerHp: input.powerHp,
    engineCapacityCc: null,
    transmission: input.transmission,
    driveType: null,
    doors: null,
    seats: null,
    exteriorColor: null,
    interiorColor: null,
    condition: "Used",
    accidentFree: true,
    owners: null,
    inspectionValidUntil: null,
    country: "DE",
    postalCode: null,
    latitude: null,
    longitude: null,
    priceGross: input.purchasePrice,
    priceNet: null,
    vatType: "GROSS" as const,
    sellerType: "DEALER" as const,
    sellerId: null,
    equipment: [],
    images: [],
    listingUrl: null,
    firstSeenAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    removedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const comparables = await mockProvider.getPriceData(targetVehicle);
  const marketSummary = summarizeMarket(comparables);
  const estimatedTransactionPrice = marketSummary.median ? Math.round(marketSummary.median * 0.973) : input.purchasePrice;
  const marginResult = calculateProjectedMargin(
    {
      auctionFee: input.auctionFee,
      financingCost: 0,
      otherCost: input.otherCost,
      preparationCost: input.preparationCost,
      purchasePrice: input.purchasePrice,
      repairCost: input.repairCost,
      transportCost: input.transportCost
    },
    estimatedTransactionPrice
  );
  const confidence = Math.min(93, 35 + comparables.length * 12);
  const demandScore = deriveDemandScore(targetVehicle);
  const liquidityScore = deriveLiquidityScore(targetVehicle);
  const marketPosition = estimatedTransactionPrice > input.purchasePrice ? 72 : 48;
  const riskScore = deriveRiskScore({
    comparablesCount: comparables.length,
    marginPercent: marginResult.projectedMarginPercent,
    mileageKm: input.mileageKm
  });
  const scoreBreakdown = buildDealerScoreBreakdown({
    confidence,
    demand: demandScore,
    liquidity: liquidityScore,
    marginPercent: marginResult.projectedMarginPercent,
    marketPosition,
    risk: riskScore
  });

  return {
    comparables,
    confidence,
    dealerScore: scoreBreakdown.overallScore,
    dealerScoreBreakdown: scoreBreakdown,
    demandScore,
    estimatedTransactionPrice,
    liquidityScore,
    marketPosition,
    marketSummary,
    projectedMargin: marginResult.projectedGrossMargin,
    projectedMarginPercent: marginResult.projectedMarginPercent,
    riskFactors: buildRiskFactors({
      comparablesCount: comparables.length,
      confidence,
      liquidityScore,
      marginPercent: marginResult.projectedMarginPercent,
      mileageKm: input.mileageKm
    }),
    riskScore,
    targetVehicle,
    totalLandedCost: marginResult.totalLandedCost
  };
}
