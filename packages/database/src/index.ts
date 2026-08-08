import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/prisma/client";

if (!process.env.DATABASE_URL) {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  process.loadEnvFile(path.resolve(currentDir, "../../../.env"));
}

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
