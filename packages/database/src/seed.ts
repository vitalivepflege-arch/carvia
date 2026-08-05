import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

const adapter = new PrismaPg({
  connectionString:
    process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5433/carvia"
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.providerCredential.deleteMany();
  await prisma.watchlist.deleteMany();
  await prisma.vehicleAnalysis.deleteMany();
  await prisma.vehicleListingSnapshot.deleteMany();
  await prisma.vehicleListing.deleteMany();
  await prisma.vehicle.deleteMany();

  const company = await prisma.company.upsert({
    where: { id: "demo-company-carvia" },
    update: {
      name: "Carvia Demo Motors",
      preferredBrands: ["BMW", "Mercedes-Benz", "Audi"]
    },
    create: {
      id: "demo-company-carvia",
      name: "Carvia Demo Motors",
      preferredBrands: ["BMW", "Mercedes-Benz", "Audi"],
      averagePurchaseBudget: "45000",
      minimumMarginTarget: "3500",
      targetDaysToSell: 35
    }
  });

  await prisma.providerCredential.createMany({
    data: [
      {
        companyId: company.id,
        providerKey: "mock",
        status: "NOT_CONFIGURED",
        credentialsHint: "Local mock provider enabled"
      },
      {
        companyId: company.id,
        providerKey: "mobile",
        status: "NOT_CONFIGURED",
        credentialsHint: "Official credentials required"
      }
    ],
    skipDuplicates: true
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
