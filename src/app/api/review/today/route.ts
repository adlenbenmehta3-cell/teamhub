import { NextResponse } from "next/server";
import { db, ensureSchemaUpToDate } from "@/lib/db";
import { getCurrentUser, isTeamLeader } from "@/lib/auth";

/**
 * GET /api/review/today?date=YYYY-MM-DD
 *
 * Returns ALL review data grouped BY WORKER, for easy browsing.
 * For each worker, returns:
 *   - Worker info (name, title, department)
 *   - All assigned tasks due today or earlier (completed + uncompleted)
 *   - All work plan checklist items for the date (completed + uncompleted)
 *   - Daily report (if submitted) with Drive link
 *
 * Admin can click any worker to expand their full task breakdown.
 */

interface WorkerData {
  id: string;
  name: string;
  title: string | null;
  department: string;
  // Tasks (one-time + recurring instances)
  tasks: {
    id: string;
    title: string;
    description: string;
    deadline: string;
    priority: string;
    status: string;
    completed: boolean;
    driveLink: string | null;
    completedAt: string | null;
    isRecurring: boolean;
    isOverdue: boolean;
  }[];
  // Work plan checklist items for the date
  workPlanItems: {
    id: string;
    title: string;
    description: string | null;
    workPlanTitle: string;
    completed: boolean;
    driveLink: string | null;
    completedAt: string | null;
  }[];
  // Daily report
  report: {
    id: string;
    completed: string;
    inProgress: string;
    blockers: string;
    tomorrow: string;
    driveLink: string | null;
    submittedAt: string;
  } | null;
  // Summary
  summary: {
    totalTasks: number;
    completedTasks: number;
    uncompletedTasks: number;
    overdueTasks: number;
    totalWorkPlanItems: number;
    completedWorkPlanItems: number;
    hasReport: boolean;
    hasDriveLinks: boolean;
  };
}

export async function GET(req: Request) {
  try {
    await ensureSchemaUpToDate();
    const user = await getCurrentUser();
    if (!user || !isTeamLeader(user.role)) {
      return NextResponse.json(
        { error: "Only Team Leaders can review submissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const date =
      searchParams.get("date") || new Date().toISOString().split("T")[0];

    // Get all active workers (non-admin)
    const workers = await db.user.findMany({
      where: { active: true, role: { not: "TEAM_LEADER" } },
      select: {
        id: true,
        name: true,
        title: true,
        department: true,
      },
      orderBy: { name: "asc" },
    });

    // Get the date range (start of day to end of day)
    const dayStart = new Date(date + "T00:00:00.000Z");
    const dayEnd = new Date(date + "T23:59:59.999Z");
    const now = new Date();

    // For each worker, gather their data
    const workersData: WorkerData[] = [];

    for (const worker of workers) {
      // 1. Get tasks: all tasks due today or earlier (uncompleted) + completed today
      const tasks = await db.task.findMany({
        where: {
          assigneeId: worker.id,
          OR: [
            // Uncompleted tasks due today or earlier (still visible)
            {
              status: "OPEN",
              deadline: { lte: dayEnd },
            },
            // Tasks completed today
            {
              status: "COMPLETED",
              completedAt: { gte: dayStart, lte: dayEnd },
            },
          ],
        },
        include: {
          recurringTask: { select: { id: true } },
        },
        orderBy: [{ deadline: "asc" }],
      });

      const tasksData = tasks.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        deadline: t.deadline.toISOString(),
        priority: t.priority,
        status: t.status,
        completed: t.status === "COMPLETED",
        driveLink: t.driveLink,
        completedAt: t.completedAt?.toISOString() || null,
        isRecurring: !!t.recurringTaskId,
        isOverdue: t.status === "OPEN" && t.deadline < now,
      }));

      // 2. Get work plan checklist items for this date
      const workPlans = await db.workPlan.findMany({
        where: {
          active: true,
          assigneeId: worker.id,
          startDate: { lte: dayEnd },
          endDate: { gte: dayStart },
        },
        include: {
          items: { orderBy: { order: "asc" } },
        },
      });

      // Get completions for this worker on this date
      const completions = await db.dailyCompletion.findMany({
        where: {
          userId: worker.id,
          date,
        },
      });
      const completionMap = new Map(
        completions.map((c) => [c.workPlanItemId, c])
      );

      const workPlanItemsData: WorkerData["workPlanItems"] = [];
      for (const wp of workPlans) {
        for (const item of wp.items) {
          const completion = completionMap.get(item.id);
          workPlanItemsData.push({
            id: item.id,
            title: item.title,
            description: item.description,
            workPlanTitle: wp.title,
            completed: completion?.completed || false,
            driveLink: completion?.driveLink || null,
            completedAt: completion?.completedAt?.toISOString() || null,
          });
        }
      }

      // 3. Get daily report
      const report = await db.report.findUnique({
        where: {
          userId_date: { userId: worker.id, date },
        },
      });

      const reportData = report
        ? {
            id: report.id,
            completed: report.completed,
            inProgress: report.inProgress,
            blockers: report.blockers,
            tomorrow: report.tomorrow,
            driveLink: report.driveLink,
            submittedAt: report.createdAt.toISOString(),
          }
        : null;

      // 4. Summary
      const completedTasks = tasksData.filter((t) => t.completed).length;
      const overdueTasks = tasksData.filter((t) => t.isOverdue).length;
      const completedWorkPlanItems = workPlanItemsData.filter(
        (i) => i.completed
      ).length;
      const hasDriveLinks =
        tasksData.some((t) => t.driveLink) ||
        workPlanItemsData.some((i) => i.driveLink) ||
        !!reportData?.driveLink;

      workersData.push({
        ...worker,
        tasks: tasksData,
        workPlanItems: workPlanItemsData,
        report: reportData,
        summary: {
          totalTasks: tasksData.length,
          completedTasks,
          uncompletedTasks: tasksData.length - completedTasks,
          overdueTasks,
          totalWorkPlanItems: workPlanItemsData.length,
          completedWorkPlanItems,
          hasReport: !!reportData,
          hasDriveLinks,
        },
      });
    }

    // Overall summary
    const totalWorkers = workersData.length;
    const workersWithActivity = workersData.filter(
      (w) =>
        w.summary.totalTasks > 0 ||
        w.summary.totalWorkPlanItems > 0 ||
        w.summary.hasReport
    ).length;
    const totalDriveLinks = workersData.filter((w) =>
      w.summary.hasDriveLinks
    ).length;

    return NextResponse.json({
      date,
      workers: workersData,
      summary: {
        totalWorkers,
        workersWithActivity,
        workersWithDriveLinks: totalDriveLinks,
        totalTasks: workersData.reduce(
          (sum, w) => sum + w.summary.totalTasks,
          0
        ),
        totalCompletedTasks: workersData.reduce(
          (sum, w) => sum + w.summary.completedTasks,
          0
        ),
        totalOverdueTasks: workersData.reduce(
          (sum, w) => sum + w.summary.overdueTasks,
          0
        ),
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
