import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isTeamLeader } from "@/lib/auth";
import { formatDate } from "@/lib/points";

/**
 * GET /api/dashboard
 * Returns aggregated stats for the dashboard.
 * Team Leader sees team-wide stats; others see personal stats.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const today = formatDate(new Date());
    const now = new Date();

    if (isTeamLeader(user.role)) {
      // Team-wide stats
      const totalMembers = await db.user.count({ where: { active: true } });
      const todayAttendance = await db.attendance.count({
        where: { date: today },
      });
      const todayLate = await db.attendance.count({
        where: { date: today, late: true },
      });
      const openTasks = await db.task.count({ where: { status: "OPEN" } });
      const overdueTasks = await db.task.count({
        where: {
          status: "OPEN",
          deadline: { lt: now },
        },
      });
      const completedTodayTasks = await db.task.count({
        where: {
          status: "COMPLETED",
          completedAt: { gte: new Date(today) },
        },
      });
      const todayReports = await db.report.count({ where: { date: today } });
      const upcomingMeetings = await db.meeting.count({
        where: { datetime: { gte: now } },
      });
      const announcements = await db.announcement.count();

      // Recent activity (last 10 actions)
      const recentPoints = await db.pointHistory.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      });

      // Team leaderboard (weekly)
      const leaderboard = await db.user.findMany({
        where: { active: true },
        orderBy: { weeklyPoints: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          department: true,
          weeklyPoints: true,
        },
      });

      // Recent announcements
      const recentAnnouncements = await db.announcement.findMany({
        take: 5,
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        include: { creator: { select: { name: true } } },
      });

      return NextResponse.json({
        type: "team_leader",
        stats: {
          totalMembers,
          todayAttendance,
          todayLate,
          todayAbsent: totalMembers - todayAttendance,
          openTasks,
          overdueTasks,
          completedTodayTasks,
          todayReports,
          upcomingMeetings,
          announcements,
        },
        recentActivity: recentPoints,
        leaderboard,
        announcements: recentAnnouncements,
      });
    } else {
      // Personal stats
      const myAttendance = await db.attendance.findUnique({
        where: { userId_date: { userId: user.id, date: today } },
      });
      const myOpenTasks = await db.task.count({
        where: { assigneeId: user.id, status: "OPEN" },
      });
      const myOverdueTasks = await db.task.count({
        where: {
          assigneeId: user.id,
          status: "OPEN",
          deadline: { lt: now },
        },
      });
      const myTodayReport = await db.report.findUnique({
        where: { userId_date: { userId: user.id, date: today } },
      });
      const myUpcomingMeetings = await db.meeting.count({
        where: { datetime: { gte: now } },
      });
      const myCompletedTasks = await db.task.count({
        where: { assigneeId: user.id, status: "COMPLETED" },
      });

      // Recent announcements
      const recentAnnouncements = await db.announcement.findMany({
        take: 5,
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        include: { creator: { select: { name: true } } },
      });

      // My upcoming meetings
      const upcomingMeetingsList = await db.meeting.findMany({
        where: { datetime: { gte: now } },
        orderBy: { datetime: "asc" },
        take: 5,
      });

      // My tasks (assigned)
      const myTasks = await db.task.findMany({
        where: { assigneeId: user.id, status: "OPEN" },
        orderBy: [{ priority: "desc" }, { deadline: "asc" }],
        take: 5,
      });

      return NextResponse.json({
        type: "member",
        stats: {
          checkedInToday: !!myAttendance,
          checkedOutToday: !!myAttendance?.checkOut,
          isLate: myAttendance?.late || false,
          myOpenTasks,
          myOverdueTasks,
          myCompletedTasks,
          myTodayReport: !!myTodayReport,
          myUpcomingMeetings,
        },
        announcements: recentAnnouncements,
        upcomingMeetings: upcomingMeetingsList,
        myTasks,
      });
    }
  } catch (e) {
    console.error("Dashboard error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب بيانات اللوحة" },
      { status: 500 }
    );
  }
}
