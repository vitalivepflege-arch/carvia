import type { AnalysisInputs, DealerScoreBreakdown, MarketSummary, Vehicle } from "@carvia/domain";

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function percentile(values: number[], ratio: number) {
  if (values.length === 0) {
    return null;
  }

  const index = Math.min(values.length - 1, Math.max(0, Math.round((values.length - 1) * ratio)));
  return values[index] ?? null;
}

export function summarizeMarket(comparables: Vehicle[]): MarketSummary {
  const comparablePrices = comparables
    .map((vehicle) => vehicle.priceGross)
    .filter((price): price is number => typeof price === "number")
    .sort((a, b) => a - b);

  const median = percentile(comparablePrices, 0.5);
  const percentile25 = percentile(comparablePrices, 0.25);
  const percentile75 = percentile(comparablePrices, 0.75);

  return {
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
  };
}

export function calculateProjectedMargin(inputs: AnalysisInputs, estimatedTransactionPrice: number) {
  const totalLandedCost =
    inputs.purchasePrice +
    inputs.transportCost +
    inputs.preparationCost +
    inputs.repairCost +
    inputs.auctionFee +
    inputs.financingCost +
    inputs.otherCost;
  const projectedGrossMargin = estimatedTransactionPrice - totalLandedCost;
  const projectedMarginPercent =
    totalLandedCost > 0 ? Math.round((projectedGrossMargin / totalLandedCost) * 1000) / 10 : 0;

  return {
    projectedGrossMargin,
    projectedMarginPercent,
    totalLandedCost
  };
}

export function deriveDemandScore(vehicle: {
  fuelType: string | null;
  make: string;
  mileageKm: number | null;
  model: string;
}) {
  const premiumMakeBoost = ["BMW", "Mercedes-Benz", "Audi", "Volkswagen"].includes(vehicle.make)
    ? 12
    : 4;
  const fuelBoost = vehicle.fuelType === "Hybrid" ? 8 : vehicle.fuelType === "Diesel" ? 2 : 5;
  const mileagePenalty = vehicle.mileageKm && vehicle.mileageKm > 90000 ? 18 : vehicle.mileageKm && vehicle.mileageKm > 60000 ? 8 : 0;
  const modelBoost = ["3 Series", "C-Class", "A5", "Golf"].includes(vehicle.model) ? 10 : 4;

  return clamp(48 + premiumMakeBoost + fuelBoost + modelBoost - mileagePenalty);
}

export function deriveLiquidityScore(vehicle: {
  firstRegistration: string | null;
  mileageKm: number | null;
}) {
  const year = vehicle.firstRegistration ? Number(vehicle.firstRegistration.slice(0, 4)) : 2023;
  const agePenalty = Math.max(0, 2026 - year) * 7;
  const mileagePenalty = vehicle.mileageKm ? Math.round(vehicle.mileageKm / 12000) : 0;

  return clamp(92 - agePenalty - mileagePenalty);
}

export function deriveRiskScore(input: {
  comparablesCount: number;
  marginPercent: number;
  mileageKm: number | null;
}) {
  const comparablePenalty = input.comparablesCount < 2 ? 24 : input.comparablesCount < 4 ? 12 : 4;
  const marginPenalty = input.marginPercent < 4 ? 30 : input.marginPercent < 7 ? 16 : 6;
  const mileagePenalty = input.mileageKm && input.mileageKm > 80000 ? 18 : input.mileageKm && input.mileageKm > 60000 ? 8 : 2;

  return clamp(100 - comparablePenalty - marginPenalty - mileagePenalty);
}

export function buildDealerScoreBreakdown(input: {
  confidence: number;
  demand: number;
  liquidity: number;
  marginPercent: number;
  marketPosition: number;
  risk: number;
}): DealerScoreBreakdown {
  const marginScore = clamp(input.marginPercent * 7.5 + 30);
  const marketPriceScore = clamp(65 + input.marketPosition * 0.35);
  const confidenceScore = clamp(input.confidence);
  const overallScore = clamp(
    marginScore * 0.24 +
      marketPriceScore * 0.18 +
      input.demand * 0.15 +
      input.liquidity * 0.14 +
      input.risk * 0.13 +
      confidenceScore * 0.16
  );

  return {
    confidenceScore,
    demandScore: clamp(input.demand),
    liquidityScore: clamp(input.liquidity),
    marginScore,
    marketPriceScore,
    overallScore,
    riskScore: clamp(input.risk)
  };
}

export function buildRiskFactors(input: {
  comparablesCount: number;
  confidence: number;
  liquidityScore: number;
  marginPercent: number;
  mileageKm: number | null;
}) {
  const factors = [];

  factors.push(
    input.marginPercent >= 8
      ? "Margin buffer remains strong even after landed-cost assumptions."
      : input.marginPercent >= 5
        ? "Margin looks workable, but there is limited room for surprises."
        : "Margin buffer is thin and needs stricter buying discipline."
  );
  factors.push(
    input.comparablesCount >= 4
      ? "Comparable coverage is broad enough for a stable mock-market read."
      : "Comparable coverage is narrow, so market confidence should be treated cautiously."
  );
  factors.push(
    input.mileageKm && input.mileageKm > 80000
      ? "Mileage is above the most liquid retail range and may slow stock turn."
      : "Mileage remains close to the more liquid retail range."
  );
  factors.push(
    input.liquidityScore >= 70
      ? "Expected liquidity is favorable for an acquisition workflow."
      : "Liquidity risk suggests a slower exit and more negotiation pressure."
  );
  factors.push(
    input.confidence >= 75
      ? "Confidence is high enough to support quick next-step action."
      : "Confidence is moderate, so the next action should include additional validation."
  );

  return factors;
}
