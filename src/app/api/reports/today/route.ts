import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatDate } from "@/lib/points";

/**
 * GET /api/reports/today
 * Returns the user's report for today, or all team reports (TL only).
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const today = formatDate(new Date());

    if (user.role === "TEAM_LEADER") {
      const allUsers = await db.user.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, department: true },
      });

      const reports = await db.report.findMany({
        where: { date: today },
        include: {
          user: { select: { id: true, name: true, department: true } },
        },
      });

      const reportMap = new Map(reports.map((r) => [r.userId, r]));
      const teamReports = allUsers.map((u) => ({
        user: u,
        report: reportMap.get(u.id) || null,
      }));

      return NextResponse.json({
        date: today,
        total: allUsers.length,
        submitted: reports.length,
        pending: allUsers.length - reports.length,
        team: teamReports,
      });
    } else {
      const report = await db.report.findUnique({
        where: { userId_date: { userId: user.id, date: today } },
      });
      return NextResponse.json({ date: today, myReport: report });
    }
  } catch (e) {
    console.error("Reports today error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب التقارير" },
      { status: 500 }
    );
  }
}
