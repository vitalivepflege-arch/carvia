"use server";

import { prisma } from "@carvia/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOnboardedSession } from "../../lib/auth";

const saveMarketVehicleSchema = z.object({
  firstRegistration: z.string().nullable(),
  fuelType: z.string().nullable(),
  listingUrl: z.string().url().nullable(),
  make: z.string().min(1),
  mileageKm: z.coerce.number().int().nonnegative().nullable(),
  model: z.string().min(1),
  note: z.string().trim().max(500).optional(),
  postalCode: z.string().nullable(),
  powerHp: z.coerce.number().int().nonnegative().nullable(),
  priceGross: z.coerce.number().nonnegative().nullable(),
  provider: z.string().min(1),
  providerVehicleId: z.string().min(1),
  transmission: z.string().nullable()
});

function readNullableString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.length > 0 ? value : null;
}

function readNullableNumber(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string" || value.length === 0) {
    return null;
  }

  return Number(value);
}

export async function saveMarketVehicleToWatchlist(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = saveMarketVehicleSchema.parse({
    firstRegistration: readNullableString(formData, "firstRegistration"),
    fuelType: readNullableString(formData, "fuelType"),
    listingUrl: readNullableString(formData, "listingUrl"),
    make: formData.get("make"),
    mileageKm: readNullableNumber(formData, "mileageKm"),
    model: formData.get("model"),
    note: typeof formData.get("note") === "string" ? formData.get("note") : undefined,
    postalCode: readNullableString(formData, "postalCode"),
    powerHp: readNullableNumber(formData, "powerHp"),
    priceGross: readNullableNumber(formData, "priceGross"),
    provider: formData.get("provider"),
    providerVehicleId: formData.get("providerVehicleId"),
    transmission: readNullableString(formData, "transmission")
  });

  const existingVehicle = await prisma.vehicle.findFirst({
    where: {
      provider: parsed.provider,
      providerVehicleId: parsed.providerVehicleId
    }
  });

  const vehicle =
    existingVehicle ??
    (await prisma.vehicle.create({
      data: {
        provider: parsed.provider,
        providerVehicleId: parsed.providerVehicleId,
        make: parsed.make,
        model: parsed.model,
        firstRegistration: parsed.firstRegistration
          ? new Date(`${parsed.firstRegistration}-01T00:00:00.000Z`)
          : null,
        mileageKm: parsed.mileageKm,
        fuelType: parsed.fuelType,
        powerHp: parsed.powerHp,
        transmission: parsed.transmission,
        priceGross: parsed.priceGross,
        country: "DE",
        postalCode: parsed.postalCode,
        listingUrl: parsed.listingUrl,
        firstSeenAt: new Date(),
        lastSeenAt: new Date()
      }
    }));

  await prisma.watchlist.upsert({
    where: {
      companyId_vehicleId: {
        companyId: session.user.companyId!,
        vehicleId: vehicle.id
      }
    },
    update: {
      note: parsed.note || undefined
    },
    create: {
      companyId: session.user.companyId!,
      note: parsed.note,
      vehicleId: vehicle.id
    }
  });

  revalidatePath("/");
  revalidatePath("/watchlist");
  revalidatePath("/market-search");
}
