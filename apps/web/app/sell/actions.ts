"use server";

import { prisma } from "@carvia/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireOnboardedSession } from "../../lib/auth";
import {
  normalizeFirstRegistration,
  normalizeFuelType,
  normalizeMake,
  normalizeModel,
  normalizeTransmission
} from "../../lib/normalization";

const sellVehicleSchema = z.object({
  bodyType: z.string().trim().min(2).max(40),
  exteriorColor: z.string().trim().min(2).max(40),
  firstRegistration: z.string().trim().min(4).max(7),
  fuelType: z.string().trim().min(3).max(30),
  make: z.string().trim().min(2).max(60),
  mileageKm: z.coerce.number().int().min(0).max(500000),
  model: z.string().trim().min(1).max(80),
  note: z.string().trim().max(500).optional(),
  postalCode: z.string().trim().min(4).max(10),
  powerHp: z.coerce.number().int().min(40).max(1500),
  priceGross: z.coerce.number().positive().max(1000000),
  transmission: z.string().trim().min(3).max(30),
  variant: z.string().trim().min(1).max(100)
});

export async function createSellVehicle(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = sellVehicleSchema.parse({
    bodyType: formData.get("bodyType"),
    exteriorColor: formData.get("exteriorColor"),
    firstRegistration: formData.get("firstRegistration"),
    fuelType: formData.get("fuelType"),
    make: formData.get("make"),
    mileageKm: formData.get("mileageKm"),
    model: formData.get("model"),
    note: typeof formData.get("note") === "string" ? formData.get("note") : undefined,
    postalCode: formData.get("postalCode"),
    powerHp: formData.get("powerHp"),
    priceGross: formData.get("priceGross"),
    transmission: formData.get("transmission"),
    variant: formData.get("variant")
  });

  const normalizedMake = normalizeMake(parsed.make).value ?? parsed.make;
  const normalizedModel = normalizeModel(parsed.model) ?? parsed.model;
  const normalizedFuelType = normalizeFuelType(parsed.fuelType).value ?? parsed.fuelType;
  const normalizedTransmission = normalizeTransmission(parsed.transmission).value ?? parsed.transmission;
  const normalizedFirstRegistration =
    normalizeFirstRegistration(parsed.firstRegistration).value ?? parsed.firstRegistration;
  const registrationDate = new Date(`${normalizedFirstRegistration}-01T00:00:00.000Z`);
  const providerVehicleId = `sell-${normalizedMake}-${normalizedModel}-${parsed.postalCode}-${Date.now()}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

  const vehicle = await prisma.vehicle.create({
    data: {
      country: "DE",
      driveType:
        parsed.bodyType === "SUV" ? "All-Wheel Drive" : parsed.bodyType === "Sedan" ? "Rear-Wheel Drive" : "Front-Wheel Drive",
      firstRegistration: registrationDate,
      firstSeenAt: new Date(),
      fuelType: normalizedFuelType,
      lastSeenAt: new Date(),
      listingUrl: null,
      make: normalizedMake,
      mileageKm: parsed.mileageKm,
      model: normalizedModel,
      postalCode: parsed.postalCode,
      powerHp: parsed.powerHp,
      priceGross: parsed.priceGross,
      provider: "manual-sell",
      providerVehicleId,
      transmission: normalizedTransmission
    }
  });

  await prisma.vehicleListing.create({
    data: {
      askingPrice: parsed.priceGross,
      sellerType: "DEALER",
      sourceProvider: "manual-sell",
      status: "LIVE",
      vehicleId: vehicle.id
    }
  });

  void session;

  revalidatePath("/");
  revalidatePath("/sell");
  redirect("/sell?created=1");
}
