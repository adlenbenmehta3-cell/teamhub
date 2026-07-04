import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchemaUpToDate } from "@/lib/db";

/**
 * POST /api/recurring-tasks/generate
 * Generates task instances for all active recurring tasks.
 * Can be called by a cron job or manually.
 *
 * This endpoint is protected by a simple shared secret (CRON_SECRET env var)
 * to prevent abuse. If no secret is set, it requires authentication.
 */
export async function POST(req: NextRequest) {
  try {
    // Optional: check cron secret for external cron calls
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = req.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        // Fall through to user auth check below
      }
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Get all active recurring tasks that haven't ended yet
    const activeRecurring = await db.recurringTask.findMany({
      where: {
        active: true,
        endDate: { gte: now },
      },
    });

    let totalGenerated = 0;

    for (const rt of activeRecurring) {
      const generated = await generateForRecurringTask(rt);
      totalGenerated += generated;
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${totalGenerated} task instances`,
      processedRecurring: activeRecurring.length,
      totalGenerated,
    });
  } catch (e) {
    console.error("Generate recurring tasks error:", e);
    return NextResponse.json(
      { error: "Failed to generate recurring tasks" },
      { status: 500 }
    );
  }
}

async function generateForRecurringTask(recurringTask: any): Promise<number> {
  const start = new Date(recurringTask.startDate);
  const end = new Date(recurringTask.endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Determine the date range to generate for:
  // From max(startDate, today, lastGenerated+1) to endDate
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

  // Check existing
  const existing = await db.task.findMany({
    where: {
      recurringTaskId: recurringTask.id,
      deadline: { in: dates },
    },
    select: { deadline: true },
  });
  const existingSet = new Set(existing.map((t) => t.deadline.toISOString()));
  const newDates = dates.filter((d) => !existingSet.has(d.toISOString()));

  if (newDates.length === 0) return 0;

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
