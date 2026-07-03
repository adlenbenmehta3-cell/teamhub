import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isTeamLeader } from "@/lib/auth";

/**
 * GET /api/attendance/all?date=YYYY-MM-DD
 * Returns attendance for a specific date (Team Leader only).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isTeamLeader(user.role)) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    const where = date ? { date } : {};
    const records = await db.attendance.findMany({
      where,
      include: {
        user: { select: { name: true, department: true, role: true } },
      },
      orderBy: { checkIn: "asc" },
    });

    return NextResponse.json({ records });
  } catch (e) {
    console.error("Attendance all error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب السجلات" },
      { status: 500 }
    );
  }
}
