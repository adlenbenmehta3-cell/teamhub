import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Use /tmp for Vercel serverless (writable at runtime), local file for dev
const dbUrl =
  process.env.DATABASE_URL ||
  (process.env.VERCEL ? "file:/tmp/teamhub.db" : "file:./db/custom.db");

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
