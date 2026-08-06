import { prisma } from "@carvia/database";
import { MockVehicleProvider } from "@carvia/providers";
import { getSavedSearches } from "./market-search";

const mockVehicleProvider = new MockVehicleProvider();

type AlertSeverity = "info" | "success" | "warning";

export async function getNotificationPreference(companyId: string) {
  const preference = await prisma.notificationPreference.findUnique({
    where: { companyId }
  });

  return (
    preference ?? {
      companyId,
      createdAt: new Date("2026-08-06T00:00:00.000Z"),
      deliveryChannel: "IN_APP",
      digestEnabled: true,
      id: "notification-default",
      recipientEmail: null,
      sendHourLocal: 8,
      updatedAt: new Date("2026-08-06T00:00:00.000Z")
    }
  );
}

export async function getAlertCenter(companyId: string) {
  const [savedSearches, watchlistItems] = await Promise.all([
    getSavedSearches(companyId),
    prisma.watchlist.findMany({
      where: { companyId },
      orderBy: [{ priority: "desc" }, { nextActionAt: "asc" }],
      select: {
        id: true,
        nextActionAt: true,
        note: true,
        priority: true,
        stage: true,
        vehicleId: true
      }
    })
  ]);

  const vehicleIds = watchlistItems.map((item) => item.vehicleId);
  const vehicles = vehicleIds.length
    ? await prisma.vehicle.findMany({
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
          priceGross: true
        }
      })
    : [];

  const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));

  const searchAlerts = await Promise.all(
    savedSearches
      .filter((search) => search.alertEnabled)
      .map(async (search) => {
        const matches = await mockVehicleProvider.searchVehicles({
          fuelType: search.filters.fuelType || undefined,
          make: search.filters.make || undefined,
          model: search.filters.model || undefined,
          purchasePriceMax: search.filters.purchasePriceMax
            ? Number(search.filters.purchasePriceMax)
            : undefined,
          transmission: search.filters.transmission || undefined
        });

        const currentResultCount = matches.length;
        const previousResultCount = search.lastRunResultCount ?? 0;
        const delta = currentResultCount - previousResultCount;

        const severity: AlertSeverity =
          delta > 0 ? "success" : currentResultCount === 0 ? "warning" : "info";

        return {
          currentResultCount,
          delta,
          filters: search.filters,
          id: search.id,
          lastRunResultCount: previousResultCount,
          name: search.name,
          severity
        };
      })
  );

  const duePipelineAlerts = watchlistItems
    .filter((item) => item.nextActionAt && item.nextActionAt <= new Date())
    .map((item) => ({
      id: item.id,
      nextActionAt: item.nextActionAt,
      note: item.note,
      priority: item.priority,
      stage: item.stage,
      vehicle: vehicleMap.get(item.vehicleId) ?? null
    }));

  const readyToBuyAlerts = watchlistItems
    .filter((item) => item.stage === "READY_TO_BUY" || item.stage === "NEGOTIATING")
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      priority: item.priority,
      stage: item.stage,
      vehicle: vehicleMap.get(item.vehicleId) ?? null
    }));

  return {
    duePipelineAlerts,
    readyToBuyAlerts,
    searchAlerts,
    summary: {
      actionableCount:
        duePipelineAlerts.length +
        searchAlerts.filter((alert) => alert.delta > 0).length +
        readyToBuyAlerts.length,
      dueTodayCount: duePipelineAlerts.length,
      readyToBuyCount: readyToBuyAlerts.length,
      searchSignalCount: searchAlerts.filter((alert) => alert.delta > 0).length
    }
  };
}

export function buildAlertDigestPreview(input: Awaited<ReturnType<typeof getAlertCenter>>) {
  const lines = [
    "Carvia Daily Digest - Thursday, August 6, 2026",
    "",
    `Actionable alerts: ${input.summary.actionableCount}`,
    `Due today: ${input.summary.dueTodayCount}`,
    `Search signals: ${input.summary.searchSignalCount}`,
    `Ready signals: ${input.summary.readyToBuyCount}`,
    ""
  ];

  if (input.searchAlerts.length > 0) {
    lines.push("Saved search changes:");
    for (const alert of input.searchAlerts.slice(0, 3)) {
      lines.push(
        `- ${alert.name}: ${alert.delta > 0 ? `+${alert.delta} new matches` : `${alert.currentResultCount} total matches`}`
      );
    }
    lines.push("");
  }

  if (input.duePipelineAlerts.length > 0) {
    lines.push("Due pipeline actions:");
    for (const alert of input.duePipelineAlerts.slice(0, 3)) {
      const vehicleLabel = alert.vehicle ? `${alert.vehicle.make} ${alert.vehicle.model}` : "Tracked vehicle";
      lines.push(`- ${vehicleLabel}: ${alert.stage.toLowerCase()} | ${alert.priority.toLowerCase()} priority`);
    }
    lines.push("");
  }

  if (input.readyToBuyAlerts.length > 0) {
    lines.push("Execution candidates:");
    for (const alert of input.readyToBuyAlerts.slice(0, 3)) {
      const vehicleLabel = alert.vehicle ? `${alert.vehicle.make} ${alert.vehicle.model}` : "Tracked vehicle";
      lines.push(`- ${vehicleLabel}: ${alert.stage.toLowerCase()}`);
    }
  }

  return lines.join("\n").trim();
}
