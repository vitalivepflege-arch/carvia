import { prisma } from "@carvia/database";

export const contactChannelLabels = {
  CALL: "Call",
  EMAIL: "Email",
  MESSAGE: "Message"
} as const;

export async function getContactWorkspace(companyId: string) {
  const contacts = await prisma.watchlistContact.findMany({
    where: { companyId },
    orderBy: [{ lastContactedAt: "desc" }, { createdAt: "desc" }],
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

  const vehicleIds = [...new Set(contacts.map((contact) => contact.watchlist.vehicleId))];
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
          country: true,
          firstRegistration: true
        }
      })
    : [];

  const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));

  return contacts.map((contact) => ({
    ...contact,
    vehicle: vehicleMap.get(contact.watchlist.vehicleId) ?? null
  }));
}
