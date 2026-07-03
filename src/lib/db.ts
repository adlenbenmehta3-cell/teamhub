import { PrismaClient } from "@prisma/client";
import { existsSync, copyFileSync, mkdirSync } from "fs";
import path from "path";
import { execSync } from "child_process";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  schemaMigrated: boolean | undefined;
};

/**
 * Database path strategy:
 *
 * - Railway (production): /data/teamhub.db
 *   Railway provides a persistent volume mounted at /data.
 *   Data survives across restarts and deployments.
 *
 * - Vercel (legacy): /tmp/teamhub.db
 *   Vercel serverless uses /tmp which is ephemeral.
 *   We copy the template (with pre-seeded admin) on each cold start.
 *   Data does NOT persist reliably.
 *
 * - Local dev: ./db/custom.db
 *   Standard SQLite file on disk.
 */

const IS_RAILWAY = !!process.env.RAILWAY_ENVIRONMENT || !!process.env.RAILWAY_VOLUME_NAME;
const IS_VERCEL = !!process.env.VERCEL;

const RAILWAY_DB_PATH = "/data/teamhub.db";
const VERCEL_TMP_DB_PATH = "/tmp/teamhub.db";

function getDbUrl(): string {
  // Railway: use persistent /data volume
  if (IS_RAILWAY) {
    ensureRailwayDb();
    return `file:${RAILWAY_DB_PATH}`;
  }

  // Vercel: copy template to /tmp on cold start (ephemeral)
  if (IS_VERCEL) {
    if (!existsSync(VERCEL_TMP_DB_PATH)) {
      copyVercelTemplate();
    }
    return `file:${VERCEL_TMP_DB_PATH}`;
  }

  // Local dev
  return process.env.DATABASE_URL || "file:./db/custom.db";
}

function ensureRailwayDb() {
  try {
    if (!existsSync("/data")) {
      mkdirSync("/data", { recursive: true });
    }
    // If DB doesn't exist yet, copy from template (includes pre-seeded admin)
    if (!existsSync(RAILWAY_DB_PATH)) {
      const templatePaths = [
        path.join(process.cwd(), "db", "teamhub-empty.db"),
        "/app/db/teamhub-empty.db",
      ];
      for (const templatePath of templatePaths) {
        if (existsSync(templatePath)) {
          try {
            copyFileSync(templatePath, RAILWAY_DB_PATH);
            console.log(`[DB] Copied template from ${templatePath} to ${RAILWAY_DB_PATH}`);
            break;
          } catch (e) {
            console.error(`[DB] Failed to copy from ${templatePath}:`, e);
          }
        }
      }
    }
  } catch (e) {
    console.error("[DB] Railway init failed:", e);
  }
}

function copyVercelTemplate() {
  try {
    if (!existsSync("/tmp")) {
      mkdirSync("/tmp", { recursive: true });
    }
    const templatePaths = [
      path.join(process.cwd(), "db", "teamhub-empty.db"),
      "/var/task/db/teamhub-empty.db",
    ];
    for (const templatePath of templatePaths) {
      if (existsSync(templatePath)) {
        try {
          copyFileSync(templatePath, VERCEL_TMP_DB_PATH);
          console.log(`[DB] Copied template from ${templatePath} to ${VERCEL_TMP_DB_PATH}`);
          break;
        } catch (e) {
          console.error(`[DB] Failed to copy from ${templatePath}:`, e);
        }
      }
    }
  } catch (e) {
    console.error("[DB] Vercel init failed:", e);
  }
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

/**
 * Auto-migrate: if the database exists but schema is outdated,
 * run prisma db push to apply changes. This is especially important
 * on Railway where the persistent /data/teamhub.db retains old schema
 * across deployments.
 */
export async function ensureSchemaUpToDate() {
  if (globalForPrisma.schemaMigrated) return;

  try {
    // Try a query that requires the latest schema (recurringTask table)
    await db.recurringTask.count();
    globalForPrisma.schemaMigrated = true;
  } catch (e) {
    // Schema is outdated — run prisma db push
    console.log("[DB] Schema outdated, running prisma db push...");
    try {
      execSync("npx prisma db push --accept-data-loss", {
        stdio: "pipe",
        env: {
          ...process.env,
          DATABASE_URL: dbUrl,
        },
        timeout: 30000,
      });
      console.log("[DB] Schema migration complete.");
      globalForPrisma.schemaMigrated = true;
    } catch (migrateErr) {
      console.error("[DB] Auto-migration failed:", migrateErr);
      // Don't set schemaMigrated — will retry on next request
    }
  }
}
