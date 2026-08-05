"use server";

import { prisma } from "@carvia/database";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOnboardedSession } from "../../lib/auth";
import { analyzeDeal } from "../../lib/deal-check";

const dealCheckSchema = z.object({
  auctionFee: z.coerce.number().nonnegative(),
  firstRegistration: z.string().min(7),
  fuelType: z.string().min(3),
  make: z.string().min(2),
  mileageKm: z.coerce.number().int().nonnegative(),
  model: z.string().min(1),
  otherCost: z.coerce.number().nonnegative(),
  powerHp: z.coerce.number().int().positive(),
  preparationCost: z.coerce.number().nonnegative(),
  purchasePrice: z.coerce.number().positive(),
  repairCost: z.coerce.number().nonnegative(),
  transmission: z.string().min(3),
  transportCost: z.coerce.number().nonnegative(),
  variant: z.string().min(1)
});

export async function createDealCheck(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = dealCheckSchema.parse({
    auctionFee: formData.get("auctionFee"),
    firstRegistration: formData.get("firstRegistration"),
    fuelType: formData.get("fuelType"),
    make: formData.get("make"),
    mileageKm: formData.get("mileageKm"),
    model: formData.get("model"),
    otherCost: formData.get("otherCost"),
    powerHp: formData.get("powerHp"),
    preparationCost: formData.get("preparationCost"),
    purchasePrice: formData.get("purchasePrice"),
    repairCost: formData.get("repairCost"),
    transmission: formData.get("transmission"),
    transportCost: formData.get("transportCost"),
    variant: formData.get("variant")
  });

  const result = await analyzeDeal(parsed);

  const vehicle = await prisma.vehicle.create({
    data: {
      provider: "manual",
      providerVehicleId: null,
      make: result.targetVehicle.make,
      model: result.targetVehicle.model,
      firstRegistration: new Date(`${result.targetVehicle.firstRegistration}-01T00:00:00.000Z`),
      mileageKm: result.targetVehicle.mileageKm,
      fuelType: result.targetVehicle.fuelType,
      powerHp: result.targetVehicle.powerHp,
      transmission: result.targetVehicle.transmission,
      driveType: result.targetVehicle.driveType,
      priceGross: parsed.purchasePrice,
      country: result.targetVehicle.country,
      postalCode: result.targetVehicle.postalCode,
      listingUrl: null,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
      removedAt: null
    }
  });

  const analysis = await prisma.vehicleAnalysis.create({
    data: {
      companyId: session.user.companyId!,
      vehicleId: vehicle.id,
      purchasePrice: parsed.purchasePrice,
      totalLandedCost: result.totalLandedCost,
      estimatedTransactionPrice: result.estimatedTransactionPrice,
      projectedMargin: result.projectedMargin,
      dealerScore: result.dealerScore,
      confidence: result.confidence
    }
  });

  redirect(`/analyses/${analysis.id}`);
}
