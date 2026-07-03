import { NextResponse } from "next/server";
import { db, ensureSchemaUpToDate } from "@/lib/db";
import { getCurrentUser, isTeamLeader } from "@/lib/auth";

/**
 * GET /api/review/today
 * Returns ALL Drive links submitted today by all workers, in one place.
 * This is the admin's central review dashboard.
 *
 * Returns:
 *  - reportLinks: Drive links from daily reports submitted today
 *  - workPlanLinks: Drive links from work plan checklist items completed today
 *  - summary: counts and stats
 */
export async function GET() {
  try {
    await ensureSchemaUpToDate();
    const user = await getCurrentUser();
    if (!user || !isTeamLeader(user.role)) {
      return NextResponse.json(
        { error: "Only Team Leaders can review submissions" },
        { status: 403 }
      );
    }

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // 1. Get today's reports with Drive links
    const reports = await db.report.findMany({
      where: {
        date: today,
        driveLink: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            title: true,
            department: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const reportLinks = reports.map((r) => ({
      type: "report",
      id: r.id,
      workerName: r.user.name,
      workerTitle: r.user.title,
      department: r.user.department,
      driveLink: r.driveLink,
      completed: r.completed,
      inProgress: r.inProgress,
      submittedAt: r.createdAt,
    }));

    // 2. Get today's work plan completions with Drive links
    const completions = await db.dailyCompletion.findMany({
      where: {
        date: today,
        driveLink: { not: null },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            title: true,
            department: true,
          },
        },
        workPlanItem: {
          include: {
            workPlan: {
              select: { id: true, title: true },
            },
          },
        },
      },
      orderBy: { completedAt: "desc" },
    });

    const workPlanLinks = completions.map((c) => ({
      type: "workplan",
      id: c.id,
      workerName: c.user.name,
      workerTitle: c.user.title,
      department: c.user.department,
      driveLink: c.driveLink,
      taskTitle: c.workPlanItem.title,
      taskDescription: c.workPlanItem.description,
      workPlanTitle: c.workPlanItem.workPlan.title,
      completedAt: c.completedAt,
    }));

    // 3. Get today's completed tasks with Drive links
    const startOfDay = new Date(today + "T00:00:00.000Z");
    const endOfDay = new Date(today + "T23:59:59.999Z");
    const completedTasks = await db.task.findMany({
      where: {
        status: "COMPLETED",
        driveLink: { not: null },
        completedAt: { gte: startOfDay, lte: endOfDay },
      },
      include: {
        assignee: {
          select: { id: true, name: true, title: true, department: true },
        },
      },
      orderBy: { completedAt: "desc" },
    });

    const taskLinks = completedTasks.map((t) => ({
      type: "task",
      id: t.id,
      workerName: t.assignee?.name || "—",
      workerTitle: t.assignee?.title || null,
      department: t.assignee?.department || "GENERAL",
      driveLink: t.driveLink,
      taskTitle: t.title,
      taskDescription: t.description,
      completedAt: t.completedAt,
    }));

    // 4. Summary
    const allWorkers = await db.user.count({
      where: { active: true, role: { not: "TEAM_LEADER" } },
    });

    const allWorkersWithLinks = new Set([
      ...reportLinks.map((r) => r.workerName),
      ...workPlanLinks.map((r) => r.workerName),
      ...taskLinks.map((r) => r.workerName),
    ]).size;

    return NextResponse.json({
      date: today,
      reportLinks,
      workPlanLinks,
      taskLinks,
      summary: {
        totalWorkers: allWorkers,
        workersSubmittedLinks: allWorkersWithLinks,
        workersNotSubmitted: allWorkers - allWorkersWithLinks,
        totalReportLinks: reportLinks.length,
        totalWorkPlanLinks: workPlanLinks.length,
        totalTaskLinks: taskLinks.length,
        totalLinks: reportLinks.length + workPlanLinks.length + taskLinks.length,
      },
    });
  } catch (e) {
    console.error("Review today error:", e);
    return NextResponse.json(
      { error: "Failed to load review data" },
      { status: 500 }
    );
  }
}
