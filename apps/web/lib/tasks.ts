import { prisma } from "@carvia/database";

export async function getTaskWorkspace(companyId: string) {
  const tasks = await prisma.watchlistTask.findMany({
    where: { companyId },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    include: {
      watchlist: {
        select: {
          id: true,
          stage: true,
          priority: true,
          vehicleId: true
        }
      }
    }
  });

  const vehicleIds = [...new Set(tasks.map((task) => task.watchlist.vehicleId))];
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

  return tasks.map((task) => ({
    ...task,
    vehicle: vehicleMap.get(task.watchlist.vehicleId) ?? null
  }));
}

export async function getOpenTaskCount(companyId: string) {
  return prisma.watchlistTask.count({
    where: {
      companyId,
      status: "OPEN"
    }
  });
}

export async function getTaskWorkspaceSummary(companyId: string) {
  const tasks = await prisma.watchlistTask.findMany({
    where: { companyId },
    select: {
      dueAt: true,
      origin: true,
      status: true
    }
  });

  const today = new Date(new Date().toDateString());
  const openTasks = tasks.filter((task) => task.status === "OPEN");
  const doneTasks = tasks.filter((task) => task.status === "DONE");
  const automatedOpenTasks = openTasks.filter((task) => task.origin === "AUTOMATION");
  const overdueTasks = openTasks.filter((task) => task.dueAt && task.dueAt < today);

  return {
    automatedOpenCount: automatedOpenTasks.length,
    doneCount: doneTasks.length,
    openCount: openTasks.length,
    overdueCount: overdueTasks.length
  };
}
