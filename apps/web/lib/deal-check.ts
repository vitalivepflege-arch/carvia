import { MockVehicleProvider } from "@carvia/providers";

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
  const comparablePrices = comparables
    .map((vehicle) => vehicle.priceGross)
    .filter((price): price is number => typeof price === "number")
    .sort((a, b) => a - b);

  const percentile = (values: number[], ratio: number) => {
    if (values.length === 0) {
      return null;
    }

    const index = Math.min(values.length - 1, Math.max(0, Math.round((values.length - 1) * ratio)));
    return values[index] ?? null;
  };

  const median = percentile(comparablePrices, 0.5);
  const percentile25 = percentile(comparablePrices, 0.25);
  const percentile75 = percentile(comparablePrices, 0.75);

  const estimatedTransactionPrice = median ? Math.round(median * 0.973) : input.purchasePrice;
  const totalLandedCost =
    input.purchasePrice +
    input.transportCost +
    input.preparationCost +
    input.repairCost +
    input.auctionFee +
    input.otherCost;
  const projectedMargin = estimatedTransactionPrice - totalLandedCost;
  const projectedMarginPercent =
    totalLandedCost > 0 ? Math.round((projectedMargin / totalLandedCost) * 1000) / 10 : 0;
  const confidence = Math.min(93, 35 + comparables.length * 12);
  const dealerScore = Math.max(
    18,
    Math.min(
      98,
      Math.round(
        projectedMarginPercent * 2.2 +
          (estimatedTransactionPrice > input.purchasePrice ? 18 : 4) +
          confidence * 0.42
      )
    )
  );

  return {
    comparables,
    confidence,
    dealerScore,
    estimatedTransactionPrice,
    marketSummary: {
      comparableCount: comparables.length,
      maximum: comparablePrices.at(-1) ?? null,
      median,
      minimum: comparablePrices.at(0) ?? null,
      percentile25,
      percentile75,
      trimmedMean:
        comparablePrices.length > 2
          ? Math.round(
              comparablePrices.slice(1, -1).reduce((sum, price) => sum + price, 0) /
                (comparablePrices.length - 2)
            )
          : median
    },
    projectedMargin,
    projectedMarginPercent,
    riskFactors: [
      projectedMargin > 3500 ? "Price attractive versus mock market." : "Margin buffer is relatively thin.",
      confidence >= 70
        ? "Comparable coverage is solid for a mock-data MVP."
        : "Confidence is limited because only few comparables match.",
      input.mileageKm > 60000
        ? "Mileage is above the most liquid sweet spot."
        : "Mileage remains in an attractive retail range."
    ],
    targetVehicle,
    totalLandedCost
  };
}
