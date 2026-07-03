import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isTeamLeader } from "@/lib/auth";
import { POINTS_CONFIG } from "@/lib/points";

// ============================================================
// GET /api/tasks — List tasks
// Query params: status (open|completed|all), assignee (userId)
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "open";
    const assigneeId = searchParams.get("assignee");

    const where: any = {};
    if (status !== "all") {
      where.status = status.toUpperCase();
    }
    if (assigneeId) {
      where.assigneeId = assigneeId;
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

// ============================================================
// POST /api/tasks — Create a task (Team Leader only)
// ============================================================

export async function POST(req: NextRequest) {
  try {
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
    const { title, description, deadline, priority, assigneeId } = body;

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
