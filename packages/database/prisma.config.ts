import path from "node:path";
import { defineConfig } from "prisma/config";

process.loadEnvFile(path.resolve(import.meta.dirname, "../../.env"));

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations"
  },
  datasource: {
    url: process.env.DATABASE_URL
  }
});
