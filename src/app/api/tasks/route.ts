import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchemaUpToDate } from "@/lib/db";
import { getCurrentUser, isTeamLeader } from "@/lib/auth";
import { POINTS_CONFIG } from "@/lib/points";

// ============================================================
// GET /api/tasks — List tasks
// Query params: status (open|completed|all), assignee (userId)
// ============================================================

export async function GET(req: NextRequest) {
  try {
    await ensureSchemaUpToDate();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Auto-generate any pending recurring task instances (fire and forget)
    generateRecurringTasksInBackground().catch(() => {});

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "open";
    const assigneeId = searchParams.get("assignee");
    const todayOnly = searchParams.get("today") === "true";

    const where: any = {};
    if (status !== "all") {
      where.status = status.toUpperCase();
    }
    if (assigneeId) {
      where.assigneeId = assigneeId;
    }
    // Filter: show ALL uncompleted (open) tasks
    if (todayOnly) {
      where.status = "OPEN";
    }

    const tasks = await db.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, department: true } },
        creator: { select: { id: true, name: true } },
      },
      orderBy: [{ priority: "desc" }, { deadline: "asc" }],
      take: 100,
    });

    return NextResponse.json({ tasks });
  } catch (e) {
    console.error("Tasks GET error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب المهام" },
      { status: 500 }
    );
  }
}

/**
 * Background generation of recurring task instances.
 * Fire-and-forget — does not block the response.
 */
async function generateRecurringTasksInBackground() {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const activeRecurring = await db.recurringTask.findMany({
      where: {
        active: true,
        endDate: { gte: now },
      },
    });

    for (const rt of activeRecurring) {
      await generateForRecurringTask(rt);
    }
  } catch (e) {
    // Silent fail — this is background work
    console.error("Background recurring generation error:", e);
  }
}

async function generateForRecurringTask(recurringTask: any): Promise<void> {
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

  if (dates.length === 0) return;

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
    return;
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

// ============================================================
// POST /api/tasks — Create a task (Team Leader only)
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
        { error: "فقط قائد الفريق يمكنه إنشاء المهام" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, deadline, priority, assigneeId, requiresDriveLink } = body;

    if (!title || !description || !deadline) {
      return NextResponse.json(
        { error: "العنوان والوصف والموعد النهائي مطلوبة" },
        { status: 400 }
      );
    }

    const task = await db.task.create({
      data: {
        title,
        description,
        deadline: new Date(deadline),
        priority: priority || "MEDIUM",
        assigneeId: assigneeId || null,
        creatorId: user.id,
        status: "OPEN",
        requiresDriveLink: requiresDriveLink !== undefined ? requiresDriveLink : true,
      },
      include: {
        assignee: { select: { id: true, name: true, department: true } },
        creator: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (e) {
    console.error("Tasks POST error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء المهمة" },
      { status: 500 }
    );
  }
}
