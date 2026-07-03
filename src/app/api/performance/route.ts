import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isTeamLeader } from "@/lib/auth";

/**
 * GET /api/performance — Current user's performance stats
 * GET /api/performance/[id] — Another user's stats (TL only)
 */

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get("userId");

    let targetUserId = currentUser.id;
    if (targetId && targetId !== currentUser.id) {
      if (!isTeamLeader(currentUser.role)) {
        return NextResponse.json(
          { error: "يمكنك فقط عرض إحصاءاتك الخاصة" },
          { status: 403 }
        );
      }
      targetUserId = targetId;
    }

    const target = await db.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        title: true,
        totalPoints: true,
        weeklyPoints: true,
        monthlyPoints: true,
        createdAt: true,
      },
    });

    if (!target) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }

    // Attendance stats (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const attendanceRecords = await db.attendance.findMany({
      where: {
        userId: targetUserId,
        checkIn: { gte: thirtyDaysAgo },
      },
      orderBy: { date: "desc" },
    });

    const attendanceDays = attendanceRecords.length;
    const lateDays = attendanceRecords.filter((r) => r.late).length;
    const punctuality =
      attendanceDays > 0
        ? Math.round(((attendanceDays - lateDays) / attendanceDays) * 100)
        : 0;
    const avgWorkMinutes =
      attendanceDays > 0
        ? Math.round(
            attendanceRecords.reduce((sum, r) => sum + r.workMinutes, 0) /
              attendanceDays
          )
        : 0;

    // Task stats
    const tasksCompleted = await db.task.count({
      where: { assigneeId: targetUserId, status: "COMPLETED" },
    });
    const tasksOpen = await db.task.count({
      where: { assigneeId: targetUserId, status: "OPEN" },
    });
    const tasksInProgress = await db.task.count({
      where: { assigneeId: targetUserId, status: "IN_PROGRESS" },
    });
    const overdueTasks = await db.task.count({
      where: {
        assigneeId: targetUserId,
        status: "OPEN",
        deadline: { lt: new Date() },
      },
    });

    // Reports stats (last 30 days)
    const reports = await db.report.count({
      where: {
        userId: targetUserId,
        createdAt: { gte: thirtyDaysAgo },
      },
    });

    // Meetings attended
    const meetingsAttended = await db.meetingAttendee.count({
      where: { userId: targetUserId, attended: true },
    });

    // Kudos received
    const kudosReceived = await db.kudos.count({
      where: { toId: targetUserId },
    });

    // Recent point history (last 20 entries)
    const recentPoints = await db.pointHistory.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      user: target,
      stats: {
        attendance: {
          daysLast30: attendanceDays,
          lateDays,
          punctualityRate: punctuality,
          avgWorkMinutes,
        },
        tasks: {
          completed: tasksCompleted,
          open: tasksOpen,
          inProgress: tasksInProgress,
          overdue: overdueTasks,
        },
        reports: {
          submittedLast30: reports,
        },
        meetings: {
          attended: meetingsAttended,
        },
        kudos: {
          received: kudosReceived,
        },
      },
      recentPoints,
    });
  } catch (e) {
    console.error("Performance error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب إحصاءات الأداء" },
      { status: 500 }
    );
  }
}
