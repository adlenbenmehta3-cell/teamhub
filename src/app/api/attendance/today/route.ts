import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isTeamLeader } from "@/lib/auth";
import { formatDate } from "@/lib/points";

/**
 * GET /api/attendance/today
 * Returns today's attendance for the team (Team Leader only) or just the caller.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const today = formatDate(new Date());

    if (isTeamLeader(user.role)) {
      // Team Leader: see all team members' attendance for today
      const allUsers = await db.user.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
      });

      const records = await db.attendance.findMany({
        where: { date: today },
        include: { user: { select: { name: true, department: true } } },
      });

      const recordMap = new Map(records.map((r) => [r.userId, r]));
      const teamAttendance = allUsers.map((u) => ({
        userId: u.id,
        name: u.name,
        department: u.department,
        attendance: recordMap.get(u.id) || null,
      }));

      const checkedIn = teamAttendance.filter((t) => t.attendance).length;
      const late = teamAttendance.filter(
        (t) => t.attendance?.late
      ).length;

      return NextResponse.json({
        date: today,
        total: allUsers.length,
        checkedIn,
        notCheckedIn: allUsers.length - checkedIn,
        late,
        team: teamAttendance,
      });
    } else {
      // Regular user: only their own
      const record = await db.attendance.findUnique({
        where: { userId_date: { userId: user.id, date: today } },
      });
      return NextResponse.json({
        date: today,
        myAttendance: record,
      });
    }
  } catch (e) {
    console.error("Attendance today error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب بيانات اليوم" },
      { status: 500 }
    );
  }
}
