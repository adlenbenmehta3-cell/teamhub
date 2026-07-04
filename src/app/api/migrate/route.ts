import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { existsSync, mkdirSync, copyFileSync } from "fs";
import path from "path";
import { db } from "@/lib/db";

/**
 * POST /api/migrate
 * Runs `prisma db push` on the production database to apply schema changes.
 * This is needed when the schema changes but the existing /data/teamhub.db
 * already exists (so the template isn't re-copied).
 *
 * Security: This endpoint is disabled after first successful migration
 * by checking if the RecurringTask table already exists.
 */
export async function POST() {
  try {
    // Check if migration already done
    try {
      await db.recurringTask.count();
      return NextResponse.json({
        success: true,
        message: "Migration already applied — schema is up to date.",
        migrated: false,
      });
    } catch {
      // Table doesn't exist — proceed with migration
    }

    const dbUrl = process.env.DATABASE_URL || "file:/data/teamhub.db";

    // Run prisma db push
    try {
      execSync("npx prisma db push --accept-data-loss", {
        stdio: "pipe",
        env: {
          ...process.env,
          DATABASE_URL: dbUrl,
        },
        timeout: 30000,
      });
    } catch (e) {
      // If npx fails (e.g., prisma not in PATH), try direct binary
      const errorMsg = e instanceof Error ? e.message : String(e);
      return NextResponse.json(
        {
          error: "Migration failed",
          details: errorMsg.substring(0, 500),
        },
        { status: 500 }
      );
    }

    // Verify
    try {
      await db.recurringTask.count();
      return NextResponse.json({
        success: true,
        message: "Migration applied successfully — RecurringTask table created.",
        migrated: true,
      });
    } catch (e) {
      return NextResponse.json(
        {
          error: "Migration verification failed",
          details: e instanceof Error ? e.message : String(e),
        },
        { status: 500 }
      );
    }
  } catch (e) {
    console.error("Migration error:", e);
    return NextResponse.json(
      {
        error: "Migration failed",
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}
