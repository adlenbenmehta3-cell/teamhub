import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchemaUpToDate } from "@/lib/db";
import { getCurrentUser, isTeamLeader } from "@/lib/auth";

// ============================================================
// GET /api/recurring-tasks — List all active recurring tasks
// ============================================================

export async function GET() {
  try {
    await ensureSchemaUpToDate();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const recurringTasks = await db.recurringTask.findMany({
      where: { active: true },
      include: {
        assignee: { select: { id: true, name: true, department: true } },
        creator: { select: { id: true, name: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ recurringTasks });
  } catch (e) {
    console.error("Recurring tasks GET error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب المهام المتكررة" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/recurring-tasks — Create a new recurring task (TL only)
// Body: {
//   title, description, priority, pattern (DAILY|WEEKLY|MONTHLY|WEEKDAYS),
//   startDate, endDate, assigneeId?
// }
// ============================================================

export async function POST(req: NextRequest) {
  try {
    await ensureSchemaUpToDate();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    if (!isTeamLeader(user.role)) {
      return NextResponse.json(
        { error: "فقط قائد الفريق يمكنه إنشاء المهام المتكررة" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      description,
      priority,
      pattern,
      startDate,
      endDate,
      assigneeId,
    } = body;

    if (!title || !description || !startDate || !endDate || !pattern) {
      return NextResponse.json(
        { error: "الحقول المطلوبة ناقصة" },
        { status: 400 }
      );
    }

    const validPatterns = ["DAILY", "WEEKLY", "MONTHLY", "WEEKDAYS"];
    if (!validPatterns.includes(pattern)) {
      return NextResponse.json(
        { error: "نمط التكرار غير صالح" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return NextResponse.json(
        { error: "تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية" },
        { status: 400 }
      );
    }

    // Create the recurring task template
    const recurringTask = await db.recurringTask.create({
      data: {
        title,
        description,
        priority: priority || "MEDIUM",
        pattern,
        startDate: start,
        endDate: end,
        assigneeId: assigneeId || null,
        creatorId: user.id,
      },
      include: {
        assignee: { select: { id: true, name: true, department: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    // Generate task instances immediately for all dates in range that match pattern
    const instances = await generateTaskInstances(recurringTask);

    return NextResponse.json({
      success: true,
      recurringTask,
      instancesCreated: instances,
    });
  } catch (e) {
    console.error("Recurring task POST error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء المهمة المتكررة" },
      { status: 500 }
    );
  }
}

/**
 * Generate task instances for all dates matching the recurrence pattern
 * between startDate and endDate (inclusive).
 */
async function generateTaskInstances(recurringTask: any): Promise<number> {
  const dates: Date[] = [];
  const start = new Date(recurringTask.startDate);
  const end = new Date(recurringTask.endDate);
  // Set deadline to end of the day (23:59)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    // Only generate for dates from today onwards (don't backfill)
    if (cursor >= today) {
      const shouldGenerate = shouldGenerateForDate(cursor, recurringTask.pattern);
      if (shouldGenerate) {
        // Set deadline to end of that day
        const deadline = new Date(cursor);
        deadline.setHours(23, 59, 0, 0);
        dates.push(deadline);
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  if (dates.length === 0) return 0;

  // Check existing instances to avoid duplicates
  const existingTasks = await db.task.findMany({
    where: {
      recurringTaskId: recurringTask.id,
      deadline: { in: dates },
    },
    select: { deadline: true },
  });
  const existingDates = new Set(
    existingTasks.map((t) => t.deadline.toISOString())
  );

  const newDates = dates.filter((d) => !existingDates.has(d.toISOString()));

  if (newDates.length === 0) return 0;

  // Create all instances
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

  // Update lastGenerated
  await db.recurringTask.update({
    where: { id: recurringTask.id },
    data: { lastGenerated: new Date() },
  });

  return newDates.length;
}

/**
 * Check if a task should be generated for the given date based on pattern.
 */
function shouldGenerateForDate(date: Date, pattern: string): boolean {
  const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday

  switch (pattern) {
    case "DAILY":
      return true;
    case "WEEKLY":
      // Generate on Mondays (or first day of week)
      return dayOfWeek === 1;
    case "MONTHLY":
      // Generate on the 1st of each month
      return date.getDate() === 1;
    case "WEEKDAYS":
      // Mon-Fri (1-5)
      return dayOfWeek >= 1 && dayOfWeek <= 5;
    default:
      return true;
  }
}
