import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { POINTS_CONFIG, formatDate } from "@/lib/points";

// ============================================================
// GET /api/reports — Get current user's reports history
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "30");

    const reports = await db.report.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: limit,
    });

    return NextResponse.json({ reports });
  } catch (e) {
    console.error("Reports GET error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب التقارير" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/reports — Submit a daily report
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const { completed, inProgress, blockers, tomorrow } = body;

    if (!completed || !inProgress) {
      return NextResponse.json(
        { error: "الحقول المكتملة وقيد التقدم مطلوبة" },
        { status: 400 }
      );
    }

    const today = formatDate(new Date());

    // Check if already submitted today
    const existing = await db.report.findUnique({
      where: { userId_date: { userId: user.id, date: today } },
    });

    if (existing) {
      // Update instead of create
      const updated = await db.report.update({
        where: { id: existing.id },
        data: {
          completed,
          inProgress,
          blockers: blockers || "لا يوجد",
          tomorrow: tomorrow || "—",
        },
      });
      return NextResponse.json({
        success: true,
        report: updated,
        updated: true,
      });
    }

    const report = await db.report.create({
      data: {
        userId: user.id,
        date: today,
        completed,
        inProgress,
        blockers: blockers || "لا يوجد",
        tomorrow: tomorrow || "—",
      },
    });

    // Award points
    const points = POINTS_CONFIG.daily_report_submitted;
    await db.user.update({
      where: { id: user.id },
      data: {
        totalPoints: { increment: points },
        weeklyPoints: { increment: points },
        monthlyPoints: { increment: points },
      },
    });

    await db.pointHistory.create({
      data: {
        userId: user.id,
        amount: points,
        reason: "تقديم تقرير يومي",
        source: "report",
      },
    });

    return NextResponse.json({ success: true, report, points });
  } catch (e) {
    console.error("Report POST error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تقديم التقرير" },
      { status: 500 }
    );
  }
}
