"use server";

import { prisma } from "@carvia/database";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireOnboardedSession } from "../../lib/auth";

const addWatchlistSchema = z.object({
  note: z.string().trim().max(500).optional(),
  vehicleId: z.string().min(1)
});

const updateWatchlistNoteSchema = z.object({
  note: z.string().trim().max(500).optional(),
  watchlistId: z.string().min(1)
});

const updateWatchlistWorkflowSchema = z.object({
  closingStatus: z
    .enum(["NONE", "PAPERWORK_PENDING", "PAYMENT_PENDING", "TRANSPORT_BOOKED", "COMPLETED", "CANCELLED"])
    .optional(),
  closingTargetDate: z.string().optional(),
  counterOfferPrice: z.string().optional(),
  handoffCompletedAt: z.string().optional(),
  latestOfferPrice: z.string().optional(),
  listingPublishedAt: z.string().optional(),
  mediaCompletedAt: z.string().optional(),
  nextActionAt: z.string().optional(),
  paperworkCompletedAt: z.string().optional(),
  paymentCompletedAt: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  reconditioningCompletedAt: z.string().optional(),
  retailAskingPrice: z.string().optional(),
  retailStatus: z.enum(["NONE", "RECONDITIONING", "MEDIA_PENDING", "LISTING_READY", "LIVE", "SOLD"]).optional(),
  retailTargetDate: z.string().optional(),
  soldAt: z.string().optional(),
  offerStatus: z.enum(["NONE", "PREPARING", "OFFER_SENT", "COUNTER_RECEIVED", "ACCEPTED", "REJECTED"]).optional(),
  stage: z.enum(["NEW", "REVIEWING", "NEGOTIATING", "READY_TO_BUY", "PASSED"]),
  targetBuyPrice: z.string().optional(),
  watchlistId: z.string().min(1)
});

const removeWatchlistSchema = z.object({
  watchlistId: z.string().min(1)
});

function readOptionalString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

export async function addVehicleToWatchlist(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = addWatchlistSchema.parse({
    note: readOptionalString(formData, "note"),
    vehicleId: formData.get("vehicleId")
  });

  const existingItem = await prisma.watchlist.findUnique({
    where: {
      companyId_vehicleId: {
        companyId: session.user.companyId!,
        vehicleId: parsed.vehicleId
      }
    }
  });

  if (existingItem) {
    await prisma.watchlist.update({
      where: { id: existingItem.id },
      data: {
        note: parsed.note || existingItem.note
      }
    });
  } else {
    await prisma.watchlist.create({
      data: {
        companyId: session.user.companyId!,
        note: parsed.note,
        priority: "MEDIUM",
        stage: "NEW",
        vehicleId: parsed.vehicleId
      }
    });
  }

  revalidatePath("/");
  revalidatePath("/pipeline");
  revalidatePath("/watchlist");
}

export async function updateWatchlistNote(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = updateWatchlistNoteSchema.parse({
    note: readOptionalString(formData, "note"),
    watchlistId: formData.get("watchlistId")
  });

  await prisma.watchlist.updateMany({
    where: {
      id: parsed.watchlistId,
      companyId: session.user.companyId!
    },
    data: {
      note: parsed.note || null
    }
  });

  revalidatePath("/watchlist");
  revalidatePath("/pipeline");
}

export async function updateWatchlistWorkflow(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = updateWatchlistWorkflowSchema.parse({
    closingStatus: readOptionalString(formData, "closingStatus"),
    closingTargetDate: readOptionalString(formData, "closingTargetDate"),
    counterOfferPrice: readOptionalString(formData, "counterOfferPrice"),
    handoffCompletedAt: readOptionalString(formData, "handoffCompletedAt"),
    latestOfferPrice: readOptionalString(formData, "latestOfferPrice"),
    listingPublishedAt: readOptionalString(formData, "listingPublishedAt"),
    mediaCompletedAt: readOptionalString(formData, "mediaCompletedAt"),
    nextActionAt: readOptionalString(formData, "nextActionAt"),
    offerStatus: readOptionalString(formData, "offerStatus"),
    paperworkCompletedAt: readOptionalString(formData, "paperworkCompletedAt"),
    paymentCompletedAt: readOptionalString(formData, "paymentCompletedAt"),
    priority: formData.get("priority"),
    reconditioningCompletedAt: readOptionalString(formData, "reconditioningCompletedAt"),
    retailAskingPrice: readOptionalString(formData, "retailAskingPrice"),
    retailStatus: readOptionalString(formData, "retailStatus"),
    retailTargetDate: readOptionalString(formData, "retailTargetDate"),
    soldAt: readOptionalString(formData, "soldAt"),
    stage: formData.get("stage"),
    targetBuyPrice: readOptionalString(formData, "targetBuyPrice"),
    watchlistId: formData.get("watchlistId")
  });

  await prisma.watchlist.updateMany({
    where: {
      id: parsed.watchlistId,
      companyId: session.user.companyId!
    },
    data: {
      closingStatus: parsed.closingStatus ?? undefined,
      closingTargetDate: parsed.closingTargetDate ? new Date(`${parsed.closingTargetDate}T00:00:00.000Z`) : null,
      closingUpdatedAt:
        parsed.closingStatus || parsed.closingTargetDate || parsed.paperworkCompletedAt || parsed.paymentCompletedAt || parsed.handoffCompletedAt
          ? new Date()
          : undefined,
      counterOfferPrice: parsed.counterOfferPrice ? Number(parsed.counterOfferPrice) : null,
      handoffCompletedAt: parsed.handoffCompletedAt ? new Date(`${parsed.handoffCompletedAt}T00:00:00.000Z`) : null,
      latestOfferPrice: parsed.latestOfferPrice ? Number(parsed.latestOfferPrice) : null,
      nextActionAt: parsed.nextActionAt ? new Date(`${parsed.nextActionAt}T00:00:00.000Z`) : null,
      offerStatus: parsed.offerStatus ?? undefined,
      offerUpdatedAt:
        parsed.offerStatus || parsed.targetBuyPrice || parsed.latestOfferPrice || parsed.counterOfferPrice
          ? new Date()
          : undefined,
      paperworkCompletedAt: parsed.paperworkCompletedAt ? new Date(`${parsed.paperworkCompletedAt}T00:00:00.000Z`) : null,
      paymentCompletedAt: parsed.paymentCompletedAt ? new Date(`${parsed.paymentCompletedAt}T00:00:00.000Z`) : null,
      priority: parsed.priority,
      reconditioningCompletedAt: parsed.reconditioningCompletedAt
        ? new Date(`${parsed.reconditioningCompletedAt}T00:00:00.000Z`)
        : null,
      retailAskingPrice: parsed.retailAskingPrice ? Number(parsed.retailAskingPrice) : null,
      retailStatus: parsed.retailStatus ?? undefined,
      retailTargetDate: parsed.retailTargetDate ? new Date(`${parsed.retailTargetDate}T00:00:00.000Z`) : null,
      retailUpdatedAt:
        parsed.retailStatus ||
        parsed.retailAskingPrice ||
        parsed.retailTargetDate ||
        parsed.reconditioningCompletedAt ||
        parsed.mediaCompletedAt ||
        parsed.listingPublishedAt ||
        parsed.soldAt
          ? new Date()
          : undefined,
      mediaCompletedAt: parsed.mediaCompletedAt ? new Date(`${parsed.mediaCompletedAt}T00:00:00.000Z`) : null,
      listingPublishedAt: parsed.listingPublishedAt ? new Date(`${parsed.listingPublishedAt}T00:00:00.000Z`) : null,
      soldAt: parsed.soldAt ? new Date(`${parsed.soldAt}T00:00:00.000Z`) : null,
      stage: parsed.stage,
      targetBuyPrice: parsed.targetBuyPrice ? Number(parsed.targetBuyPrice) : null
    }
  });

  revalidatePath("/");
  revalidatePath("/closings");
  revalidatePath("/offers");
  revalidatePath("/pipeline");
  revalidatePath("/retail");
  revalidatePath("/watchlist");
}

export async function removeWatchlistItem(formData: FormData) {
  const session = await requireOnboardedSession();
  const parsed = removeWatchlistSchema.parse({
    watchlistId: formData.get("watchlistId")
  });

  await prisma.watchlist.deleteMany({
    where: {
      id: parsed.watchlistId,
      companyId: session.user.companyId!
    }
  });

  revalidatePath("/");
  revalidatePath("/pipeline");
  revalidatePath("/watchlist");
}
