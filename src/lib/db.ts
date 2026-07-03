import { PrismaClient } from "@prisma/client";
import { existsSync, copyFileSync, mkdirSync } from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// On Vercel serverless, /tmp is writable but ephemeral (resets on cold start)
// Strategy: bundle a pre-built empty SQLite file, copy it to /tmp on cold start
// For local dev, use the local db file directly

const IS_VERCEL = !!process.env.VERCEL;
const TMP_DB_PATH = "/tmp/teamhub.db";

function getDbUrl(): string {
  if (IS_VERCEL) {
    // Check if /tmp/teamhub.db exists, if not, copy from bundled template
    if (!existsSync(TMP_DB_PATH)) {
      try {
        // Ensure /tmp exists
        if (!existsSync("/tmp")) {
          mkdirSync("/tmp", { recursive: true });
        }
        // Try to copy from bundled empty db template
        // The template is at node_modules/teamhub-empty.db or similar
        const templatePaths = [
          path.join(process.cwd(), "db", "teamhub-empty.db"),
          path.join(process.cwd(), "prisma", "teamhub-empty.db"),
          "/var/task/db/teamhub-empty.db",
        ];
        for (const templatePath of templatePaths) {
          if (existsSync(templatePath)) {
            try {
              copyFileSync(templatePath, TMP_DB_PATH);
              console.log(`[DB] Copied template from ${templatePath} to ${TMP_DB_PATH}`);
              break;
            } catch (e) {
              console.error(`[DB] Failed to copy from ${templatePath}:`, e);
            }
          }
        }
      } catch (e) {
        console.error("[DB] Init failed:", e);
      }
    }
    return `file:${TMP_DB_PATH}`;
  }
  // Local dev
  return process.env.DATABASE_URL || "file:./db/custom.db";
}

const dbUrl = getDbUrl();

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
