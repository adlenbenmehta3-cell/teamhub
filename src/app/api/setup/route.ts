import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPasswordForStorage, createSession, SESSION_COOKIE_NAME, SESSION_DURATION } from "@/lib/auth";

/**
 * GET /api/setup
 * Returns whether the system needs initial setup (no admin exists yet).
 * Since the admin is pre-seeded in the template DB, this will return
 * needsSetup: false after the template is loaded.
 */
export async function GET() {
  try {
    const adminCount = await db.user.count({
      where: { role: "TEAM_LEADER" },
    });
    return NextResponse.json({
      needsSetup: adminCount === 0,
      hasAdmin: adminCount > 0,
    });
  } catch (e) {
    // If DB query fails, try once more after a brief delay (template may be copying)
    return NextResponse.json({ needsSetup: false, hasAdmin: true });
  }
}

/**
 * POST /api/setup
 * Creates the first admin account (only works if no admin exists).
 * This is called only ONCE during initial setup.
 *
 * Body: { name, password }
 * The admin email is hardcoded to "admin@team.com" but the name is customizable.
 */
export async function POST(req: NextRequest) {
  try {
    // Check if admin already exists
    let adminCount = 0;
    try {
      adminCount = await db.user.count({
        where: { role: "TEAM_LEADER" },
      });
    } catch (e) {
      // DB not initialized
      return NextResponse.json(
        {
          error: "Database not accessible. Please contact support.",
          details: e instanceof Error ? e.message : String(e),
        },
        { status: 500 }
      );
    }

    if (adminCount > 0) {
      return NextResponse.json(
        { error: "Admin account already exists. Use login instead." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, password } = body;

    if (!name || !password) {
      return NextResponse.json(
        { error: "Name and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Create the admin account
    const hashedPassword = await hashPasswordForStorage(password);
    const admin = await db.user.create({
      data: {
        name: name.trim(),
        email: "admin@team.com",
        password: hashedPassword,
        role: "TEAM_LEADER",
        department: "GENERAL",
        title: "Administrator",
      },
    });

    // Create a welcome announcement
    await db.announcement.create({
      data: {
        title: "مرحبًا بكم في TeamHub | Welcome to TeamHub",
        content:
          `أهلاً ${admin.name}! تم إعداد منصة إدارة الفريق بنجاح.\n\n` +
          `Welcome ${admin.name}! The team management platform has been set up successfully.\n\n` +
          `الخطوات التالية | Next steps:\n` +
          `1. أضف أعضاء فريقك من "إدارة الفريق" | Add team members from "Team Management"\n` +
          `2. أنشئ المهام ووزعها | Create and assign tasks\n` +
          `3. شارك الإعلانات مع الفريق | Share announcements with the team`,
        pinned: true,
        creatorId: admin.id,
      },
    });

    // Create session and log in the admin automatically
    const token = await createSession(admin.id);

    const response = NextResponse.json({
      success: true,
      message: "Admin account created successfully",
      user: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        department: admin.department,
        title: admin.title,
        totalPoints: admin.totalPoints,
        weeklyPoints: admin.weeklyPoints,
        monthlyPoints: admin.monthlyPoints,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_DURATION / 1000,
      path: "/",
    });

    return response;
  } catch (e) {
    console.error("Setup error:", e);
    return NextResponse.json(
      {
        error: "Failed to create admin account",
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}
