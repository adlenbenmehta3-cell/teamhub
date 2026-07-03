import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { existsSync, copyFileSync, mkdirSync, unlinkSync } from "fs";
import path from "path";

/**
 * POST /api/seed
 * Resets the database to a clean state by copying the empty template.
 * After reset, the user will need to run /api/setup to create their admin account.
 *
 * This is essentially a "factory reset" — all data is lost.
 */
export async function POST() {
  try {
    const IS_VERCEL = !!process.env.VERCEL;
    const TMP_DB_PATH = "/tmp/teamhub.db";

    if (IS_VERCEL) {
      // On Vercel: delete the /tmp db so it gets re-copied from template on next request
      try {
        if (existsSync(TMP_DB_PATH)) {
          unlinkSync(TMP_DB_PATH);
        }
      } catch (e) {
        // ignore
      }
      return NextResponse.json({
        success: true,
        message: "Database reset. Please run setup again.",
      });
    }

    // Local dev: copy empty template over the working db
    const templatePath = path.join(process.cwd(), "db", "teamhub-empty.db");
    const targetPath = path.join(process.cwd(), "db", "custom.db");

    if (!existsSync(templatePath)) {
      return NextResponse.json(
        { error: "Template database not found" },
        { status: 500 }
      );
    }

    try {
      copyFileSync(templatePath, targetPath);
    } catch (e) {
      return NextResponse.json(
        {
          error: "Failed to reset database",
          details: e instanceof Error ? e.message : String(e),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Database reset to empty state. Please run setup.",
    });
  } catch (e) {
    console.error("Seed/reset error:", e);
    return NextResponse.json(
      {
        error: "Reset failed",
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/seed
 * Returns database status info.
 */
export async function GET() {
  try {
    const userCount = await db.user.count();
    const adminCount = await db.user.count({
      where: { role: "TEAM_LEADER" },
    });
    return NextResponse.json({
      totalUsers: userCount,
      hasAdmin: adminCount > 0,
      needsSetup: adminCount === 0,
    });
  } catch (e) {
    return NextResponse.json({
      totalUsers: 0,
      hasAdmin: false,
      needsSetup: true,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
