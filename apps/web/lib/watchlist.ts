import { prisma } from "@carvia/database";

export const watchlistStageOrder = ["NEW", "REVIEWING", "NEGOTIATING", "READY_TO_BUY", "PASSED"] as const;

export const watchlistStageLabels: Record<(typeof watchlistStageOrder)[number], string> = {
  NEGOTIATING: "Negotiating",
  NEW: "New",
  PASSED: "Passed",
  READY_TO_BUY: "Ready to buy",
  REVIEWING: "Reviewing"
};

export const watchlistOfferStatusLabels = {
  ACCEPTED: "Accepted",
  COUNTER_RECEIVED: "Counter received",
  NONE: "No offer",
  OFFER_SENT: "Offer sent",
  PREPARING: "Preparing",
  REJECTED: "Rejected"
} as const;

export const watchlistClosingStatusLabels = {
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
  NONE: "No closing",
  PAPERWORK_PENDING: "Paperwork pending",
  PAYMENT_PENDING: "Payment pending",
  TRANSPORT_BOOKED: "Transport booked"
} as const;

export const watchlistRetailStatusLabels = {
  LISTING_READY: "Listing ready",
  LIVE: "Live",
  MEDIA_PENDING: "Media pending",
  NONE: "No retail flow",
  RECONDITIONING: "Reconditioning",
  SOLD: "Sold"
} as const;

export const watchlistSalesStatusLabels = {
  LEAD_NEW: "Lead new",
  LOST: "Lost",
  NEGOTIATING: "Negotiating",
  NONE: "No sales flow",
  RESERVATION_PENDING: "Reservation pending",
  TEST_DRIVE_SCHEDULED: "Test drive scheduled",
  WON: "Won"
} as const;

export async function getWatchlistItems(companyId: string) {
  const items = await prisma.watchlist.findMany({
    where: { companyId },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }]
  });

  if (items.length === 0) {
    return [];
  }

  const vehicleIds = [...new Set(items.map((item) => item.vehicleId))];
  const [vehicles, analyses, tasks, activities, contacts] = await Promise.all([
    prisma.vehicle.findMany({
      where: {
        id: {
          in: vehicleIds
        }
      },
      select: {
        id: true,
        make: true,
        model: true,
        firstRegistration: true,
        mileageKm: true,
        fuelType: true,
        transmission: true,
        powerHp: true,
        priceGross: true,
        country: true
      }
    }),
    prisma.vehicleAnalysis.findMany({
      where: {
        companyId,
        vehicleId: {
          in: vehicleIds
        }
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        vehicleId: true,
        estimatedTransactionPrice: true,
        projectedMargin: true,
        dealerScore: true,
        confidence: true,
        createdAt: true
      }
    }),
    prisma.watchlistTask.findMany({
      where: {
        companyId,
        status: "OPEN",
        watchlistId: {
          in: items.map((item) => item.id)
        }
      },
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        watchlistId: true,
        title: true,
        assigneeName: true,
        dueAt: true,
        createdAt: true
      }
    }),
    prisma.watchlistActivity.findMany({
      where: {
        companyId,
        watchlistId: {
          in: items.map((item) => item.id)
        }
      },
      orderBy: [{ happenedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        watchlistId: true,
        type: true,
        summary: true,
        details: true,
        createdByName: true,
        happenedAt: true,
        createdAt: true
      }
    }),
    prisma.watchlistContact.findMany({
      where: {
        companyId,
        watchlistId: {
          in: items.map((item) => item.id)
        }
      },
      orderBy: [{ lastContactedAt: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        watchlistId: true,
        fullName: true,
        companyName: true,
        roleLabel: true,
        email: true,
        phone: true,
        preferredChannel: true,
        lastContactedAt: true,
        notes: true,
        createdAt: true
      }
    })
  ]);

  const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const latestAnalysisByVehicle = new Map<string, (typeof analyses)[number]>();
  const tasksByWatchlist = new Map<string, Array<(typeof tasks)[number]>>();
  const activitiesByWatchlist = new Map<string, Array<(typeof activities)[number]>>();
  const contactsByWatchlist = new Map<string, Array<(typeof contacts)[number]>>();

  for (const analysis of analyses) {
    if (analysis.vehicleId && !latestAnalysisByVehicle.has(analysis.vehicleId)) {
      latestAnalysisByVehicle.set(analysis.vehicleId, analysis);
    }
  }

  for (const task of tasks) {
    const existing = tasksByWatchlist.get(task.watchlistId) ?? [];
    existing.push(task);
    tasksByWatchlist.set(task.watchlistId, existing);
  }

  for (const activity of activities) {
    const existing = activitiesByWatchlist.get(activity.watchlistId) ?? [];
    existing.push(activity);
    activitiesByWatchlist.set(activity.watchlistId, existing);
  }

  for (const contact of contacts) {
    const existing = contactsByWatchlist.get(contact.watchlistId) ?? [];
    existing.push(contact);
    contactsByWatchlist.set(contact.watchlistId, existing);
  }

  return items
    .map((item) => ({
      ...item,
      analysis: latestAnalysisByVehicle.get(item.vehicleId) ?? null,
      counterOfferPrice: item.counterOfferPrice ? Number(item.counterOfferPrice) : null,
      closingTargetDate: item.closingTargetDate,
      closingUpdatedAt: item.closingUpdatedAt,
      contacts: contactsByWatchlist.get(item.id) ?? [],
      handoffCompletedAt: item.handoffCompletedAt,
      latestOfferPrice: item.latestOfferPrice ? Number(item.latestOfferPrice) : null,
      listingPublishedAt: item.listingPublishedAt,
      leadCount: item.leadCount,
      holdingCost: item.holdingCost ? Number(item.holdingCost) : null,
      inventoryUpdatedAt: item.inventoryUpdatedAt,
      mediaCompletedAt: item.mediaCompletedAt,
      miscCost: item.miscCost ? Number(item.miscCost) : null,
      paperworkCompletedAt: item.paperworkCompletedAt,
      paymentCompletedAt: item.paymentCompletedAt,
      recentActivities: activitiesByWatchlist.get(item.id) ?? [],
      reconditioningCompletedAt: item.reconditioningCompletedAt,
      reconditioningCost: item.reconditioningCost ? Number(item.reconditioningCost) : null,
      reservationPlacedAt: item.reservationPlacedAt,
      retailAskingPrice: item.retailAskingPrice ? Number(item.retailAskingPrice) : null,
      retailTargetDate: item.retailTargetDate,
      retailUpdatedAt: item.retailUpdatedAt,
      salesTargetDate: item.salesTargetDate,
      salesUpdatedAt: item.salesUpdatedAt,
      soldRetailPrice: item.soldRetailPrice ? Number(item.soldRetailPrice) : null,
      soldAt: item.soldAt,
      testDriveScheduledAt: item.testDriveScheduledAt,
      targetBuyPrice: item.targetBuyPrice ? Number(item.targetBuyPrice) : null,
      transportCost: item.transportCost ? Number(item.transportCost) : null,
      openTasks: tasksByWatchlist.get(item.id) ?? [],
      vehicle: vehicleMap.get(item.vehicleId) ?? null
    }))
    .filter(
      (
        item
      ): item is typeof item & {
        vehicle: NonNullable<typeof item.vehicle>;
      } => item.vehicle !== null
    )
    .map((item) => ({
      ...item,
      analysis: item.analysis
        ? {
            ...item.analysis,
            estimatedTransactionPrice: item.analysis.estimatedTransactionPrice
              ? Number(item.analysis.estimatedTransactionPrice)
              : null,
            projectedMargin: item.analysis.projectedMargin ? Number(item.analysis.projectedMargin) : null
          }
        : null,
      contacts: item.contacts,
      recentActivities: item.recentActivities,
      openTasks: item.openTasks,
      vehicle: {
        ...item.vehicle,
        priceGross: item.vehicle.priceGross ? Number(item.vehicle.priceGross) : null
      }
    }));
}

export async function getWatchlistPipelineSummary(companyId: string) {
  const [items, openTaskCount] = await Promise.all([
    prisma.watchlist.findMany({
      where: { companyId },
      select: {
        closingStatus: true,
        id: true,
        nextActionAt: true,
        offerStatus: true,
        priority: true,
        retailStatus: true,
        salesStatus: true,
        stage: true
      }
    }),
    prisma.watchlistTask.count({
      where: {
        companyId,
        status: "OPEN"
      }
    })
  ]);

  return {
    dueNowCount: items.filter((item) => item.nextActionAt && item.nextActionAt <= new Date()).length,
    highPriorityCount: items.filter((item) => item.priority === "HIGH").length,
    negotiatingCount: items.filter((item) => item.stage === "NEGOTIATING").length,
    activeOfferCount: items.filter((item) => item.offerStatus === "OFFER_SENT" || item.offerStatus === "COUNTER_RECEIVED").length,
    activeClosingCount: items.filter(
      (item) =>
        item.closingStatus === "PAPERWORK_PENDING" ||
        item.closingStatus === "PAYMENT_PENDING" ||
        item.closingStatus === "TRANSPORT_BOOKED"
    ).length,
    activeRetailCount: items.filter(
      (item) =>
        item.retailStatus === "RECONDITIONING" ||
        item.retailStatus === "MEDIA_PENDING" ||
        item.retailStatus === "LISTING_READY" ||
        item.retailStatus === "LIVE"
    ).length,
    activeSalesCount: items.filter(
      (item) =>
        item.salesStatus === "LEAD_NEW" ||
        item.salesStatus === "RESERVATION_PENDING" ||
        item.salesStatus === "TEST_DRIVE_SCHEDULED" ||
        item.salesStatus === "NEGOTIATING"
    ).length,
    readyToBuyCount: items.filter((item) => item.stage === "READY_TO_BUY").length,
    openTaskCount
  };
}
