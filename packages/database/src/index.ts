import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

declare global {
  var __carviaPrisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__carviaPrisma__ ??
  new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL
    }),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__carviaPrisma__ = prisma;
}
