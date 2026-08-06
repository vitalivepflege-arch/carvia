import { prisma } from "@carvia/database";

export const watchlistStageOrder = ["NEW", "REVIEWING", "NEGOTIATING", "READY_TO_BUY", "PASSED"] as const;

export const watchlistStageLabels: Record<(typeof watchlistStageOrder)[number], string> = {
  NEGOTIATING: "Negotiating",
  NEW: "New",
  PASSED: "Passed",
  READY_TO_BUY: "Ready to buy",
  REVIEWING: "Reviewing"
};

export async function getWatchlistItems(companyId: string) {
  const items = await prisma.watchlist.findMany({
    where: { companyId },
    orderBy: [{ priority: "desc" }, { createdAt: "desc" }]
  });

  if (items.length === 0) {
    return [];
  }

  const vehicleIds = [...new Set(items.map((item) => item.vehicleId))];
  const [vehicles, analyses, tasks] = await Promise.all([
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
    })
  ]);

  const vehicleMap = new Map(vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const latestAnalysisByVehicle = new Map<string, (typeof analyses)[number]>();
  const tasksByWatchlist = new Map<string, Array<(typeof tasks)[number]>>();

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

  return items
    .map((item) => ({
      ...item,
      analysis: latestAnalysisByVehicle.get(item.vehicleId) ?? null,
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
        id: true,
        nextActionAt: true,
        priority: true,
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
    readyToBuyCount: items.filter((item) => item.stage === "READY_TO_BUY").length,
    openTaskCount
  };
}
