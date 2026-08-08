import { prisma } from "@carvia/database";
import { buildAssigneeLabel } from "./team";

export async function getTaskWorkspace(companyId: string) {
  const tasks = await prisma.watchlistTask.findMany({
    where: { companyId },
    orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    include: {
      assigneeUser: {
        select: {
          email: true,
          name: true,
          role: true
        }
      },
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
    assigneeLabel: buildAssigneeLabel({
      assigneeName: task.assigneeName,
      assigneeRole: task.assigneeRole,
      assigneeUser: task.assigneeUser
    }),
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
      assigneeRole: true,
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
  const buyerQueueCount = openTasks.filter((task) => task.assigneeRole === "BUYER").length;
  const salesQueueCount = openTasks.filter((task) => task.assigneeRole === "SALES").length;
  const adminQueueCount = openTasks.filter((task) => task.assigneeRole === "ADMIN" || task.assigneeRole === "OWNER").length;

  return {
    adminQueueCount,
    automatedOpenCount: automatedOpenTasks.length,
    buyerQueueCount,
    doneCount: doneTasks.length,
    openCount: openTasks.length,
    overdueCount: overdueTasks.length,
    salesQueueCount
  };
}
