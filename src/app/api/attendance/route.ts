import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { POINTS_CONFIG, formatDate, isLate, calcWorkMinutes } from "@/lib/points";

// ============================================================
// POST /api/attendance — Check-in or Check-out
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const { action } = body; // "checkin" or "checkout"
    const today = formatDate(new Date());

    if (action === "checkin") {
      // Check if already checked in
      const existing = await db.attendance.findUnique({
        where: { userId_date: { userId: user.id, date: today } },
      });

      if (existing) {
        return NextResponse.json(
          { error: "لقد سجّلت حضورك اليوم بالفعل" },
          { status: 400 }
        );
      }

      const now = new Date();
      const late = isLate(now);
      const points = late
        ? POINTS_CONFIG.late_checkin
        : POINTS_CONFIG.on_time_checkin;

      const attendance = await db.attendance.create({
        data: {
          userId: user.id,
          date: today,
          checkIn: now,
          late,
          points,
        },
      });

      // Add points to user
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
          reason: late ? "تسجيل حضور متأخر" : "تسجيل حضور في الوقت",
          source: "checkin",
        },
      });

      return NextResponse.json({
        success: true,
        attendance,
        points,
        late,
      });
    } else if (action === "checkout") {
      const attendance = await db.attendance.findUnique({
        where: { userId_date: { userId: user.id, date: today } },
      });

      if (!attendance) {
        return NextResponse.json(
          { error: "لم تسجّل حضورك اليوم بعد" },
          { status: 400 }
        );
      }

      if (attendance.checkOut) {
        return NextResponse.json(
          { error: "لقد سجّلت انصرافك اليوم بالفعل" },
          { status: 400 }
        );
      }

      const now = new Date();
      const workMinutes = calcWorkMinutes(attendance.checkIn, now);

      const updated = await db.attendance.update({
        where: { id: attendance.id },
        data: { checkOut: now, workMinutes },
      });

      return NextResponse.json({
        success: true,
        attendance: updated,
        workMinutes,
      });
    } else {
      return NextResponse.json(
        { error: "إجراء غير صالح. استخدم checkin أو checkout" },
        { status: 400 }
      );
    }
  } catch (e) {
    console.error("Attendance POST error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء معالجة الطلب" },
      { status: 500 }
    );
  }
}

// ============================================================
// GET /api/attendance — Get current user's attendance history
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "30");

    const records = await db.attendance.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
      take: limit,
    });

    return NextResponse.json({ records });
  } catch (e) {
    console.error("Attendance GET error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب السجلات" },
      { status: 500 }
    );
  }
}
