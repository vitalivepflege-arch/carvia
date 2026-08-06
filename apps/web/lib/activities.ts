import { prisma } from "@carvia/database";

export const activityTypeLabels = {
  CALL: "Call",
  DOCUMENT: "Document",
  EMAIL: "Email",
  MEETING: "Meeting",
  MESSAGE: "Message",
  NOTE: "Internal note"
} as const;

export async function getActivityWorkspace(companyId: string) {
  const activities = await prisma.watchlistActivity.findMany({
    where: { companyId },
    orderBy: [{ happenedAt: "desc" }, { createdAt: "desc" }],
    take: 60,
    include: {
      watchlist: {
        select: {
          id: true,
          priority: true,
          stage: true,
          vehicleId: true
        }
      }
    }
  });

  const vehicleIds = [...new Set(activities.map((activity) => activity.watchlist.vehicleId))];
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
          country: true
        }
      })
    : [];

  const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));

  return activities.map((activity) => ({
    ...activity,
    vehicle: vehicleMap.get(activity.watchlist.vehicleId) ?? null
  }));
}
