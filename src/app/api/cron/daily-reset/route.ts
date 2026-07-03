import { NextResponse } from "next/server";
import { db, ensureSchemaUpToDate } from "@/lib/db";
import { getCurrentUser, isTeamLeader } from "@/lib/auth";

/**
 * GET /api/cron/daily-reset
 * Called daily (manually or by cron) to:
 * 1. Reset weekly points on Monday
 * 2. Reset monthly points on the 1st of each month
 * 3. Generate recurring task instances for the new day
 *
 * No authentication required — protected by CRON_SECRET if set.
 * If CRON_SECRET is not set, requires admin auth.
 */

export async function GET(req: Request) {
  try {
    // Check cron secret if set
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      // If no cron secret, require admin auth
      const user = await getCurrentUser();
      if (!user || !isTeamLeader(user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    await ensureSchemaUpToDate();

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const dayOfMonth = now.getDate();

    const results: string[] = [];

    // 1. Reset weekly points on Monday (dayOfWeek === 1)
    if (dayOfWeek === 1) {
      await db.user.updateMany({
        where: { weeklyPoints: { not: 0 } },
        data: { weeklyPoints: 0 },
      });
      results.push("Weekly points reset (Monday)");
    }

    // 2. Reset monthly points on the 1st of each month
    if (dayOfMonth === 1) {
      await db.user.updateMany({
        where: { monthlyPoints: { not: 0 } },
        data: { monthlyPoints: 0 },
      });
      results.push("Monthly points reset (1st of month)");
    }

    // 3. Generate recurring task instances
    try {
      const activeRecurring = await db.recurringTask.findMany({
        where: {
          active: true,
          endDate: { gte: now },
        },
      });

      let totalGenerated = 0;
      for (const rt of activeRecurring) {
        totalGenerated += await generateForRecurringTask(rt);
      }
      results.push(`Generated ${totalGenerated} recurring task instances`);
    } catch (e) {
      results.push("Recurring task generation skipped");
    }

    return NextResponse.json({
      success: true,
      date: now.toISOString().split("T")[0],
      dayOfWeek,
      dayOfMonth,
      actions: results,
    });
  } catch (e) {
    console.error("Daily reset error:", e);
    return NextResponse.json(
      { error: "Daily reset failed" },
      { status: 500 }
    );
  }
}

async function generateForRecurringTask(recurringTask: any): Promise<number> {
  const start = new Date(recurringTask.startDate);
  const end = new Date(recurringTask.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let rangeStart = new Date(today);
  if (start > rangeStart) rangeStart = new Date(start);

  if (recurringTask.lastGenerated) {
    const lastGen = new Date(recurringTask.lastGenerated);
    lastGen.setDate(lastGen.getDate() + 1);
    lastGen.setHours(0, 0, 0, 0);
    if (lastGen > rangeStart) rangeStart = lastGen;
  }

  const dates: Date[] = [];
  const cursor = new Date(rangeStart);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    if (shouldGenerateForDate(cursor, recurringTask.pattern)) {
      const deadline = new Date(cursor);
      deadline.setHours(23, 59, 0, 0);
      dates.push(deadline);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (dates.length === 0) return 0;

  const existing = await db.task.findMany({
    where: {
      recurringTaskId: recurringTask.id,
      deadline: { in: dates },
    },
    select: { deadline: true },
  });
  const existingSet = new Set(existing.map((t) => t.deadline.toISOString()));
  const newDates = dates.filter((d) => !existingSet.has(d.toISOString()));

  if (newDates.length === 0) {
    await db.recurringTask.update({
      where: { id: recurringTask.id },
      data: { lastGenerated: new Date() },
    });
    return 0;
  }

  await db.task.createMany({
    data: newDates.map((deadline) => ({
      title: recurringTask.title,
      description: recurringTask.description,
      deadline,
      priority: recurringTask.priority,
      status: "OPEN",
      assigneeId: recurringTask.assigneeId,
      creatorId: recurringTask.creatorId,
      recurringTaskId: recurringTask.id,
      requiresDriveLink: recurringTask.requiresDriveLink,
    })),
  });

  await db.recurringTask.update({
    where: { id: recurringTask.id },
    data: { lastGenerated: new Date() },
  });

  return newDates.length;
}

function shouldGenerateForDate(date: Date, pattern: string): boolean {
  const dayOfWeek = date.getDay();
  switch (pattern) {
    case "DAILY":
      return true;
    case "WEEKLY":
      return dayOfWeek === 1;
    case "MONTHLY":
      return date.getDate() === 1;
    case "WEEKDAYS":
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    default:
      return true;
  }
}
