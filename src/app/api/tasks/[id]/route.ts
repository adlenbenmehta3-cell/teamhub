import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchemaUpToDate } from "@/lib/db";
import { getCurrentUser, isTeamLeader } from "@/lib/auth";
import { POINTS_CONFIG } from "@/lib/points";

// ============================================================
// PATCH /api/tasks/[id] — Update a task
// Body: { action: "complete" | "assign" | "cancel", ... }
// ============================================================

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    const task = await db.task.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: "المهمة غير موجودة" }, { status: 404 });
    }

    if (action === "complete") {
      // Assignee or Team Leader can complete
      const isAssignee = task.assigneeId === user.id;
      if (!isAssignee && !isTeamLeader(user.role)) {
        return NextResponse.json(
          { error: "فقط المكلف أو قائد الفريق يمكنه إتمام المهمة" },
          { status: 403 }
        );
      }

      if (task.status === "COMPLETED") {
        return NextResponse.json(
          { error: "تم إتمام هذه المهمة بالفعل" },
          { status: 400 }
        );
      }

      // Workers must provide a Google Drive link to complete a task
      const driveLink = body.driveLink?.trim();
      if (!isTeamLeader(user.role) && !driveLink) {
        return NextResponse.json(
          { error: "يجب إضافة رابط Google Drive قبل إتمام المهمة" },
          { status: 400 }
        );
      }

      // Validate URL if provided
      let normalizedDriveLink: string | null = null;
      if (driveLink) {
        try {
          new URL(driveLink);
          normalizedDriveLink = driveLink;
        } catch {
          return NextResponse.json(
            { error: "رابط Google Drive غير صالح" },
            { status: 400 }
          );
        }
      }

      const now = new Date();
      const isEarly = now < task.deadline;
      const points = isEarly
        ? POINTS_CONFIG.task_completed_early
        : POINTS_CONFIG.task_completed;

      const updated = await db.task.update({
        where: { id },
        data: {
          status: "COMPLETED",
          completedAt: now,
          completionNotes: body.notes || null,
          driveLink: normalizedDriveLink,
        },
        include: {
          assignee: { select: { id: true, name: true, department: true } },
          creator: { select: { id: true, name: true } },
        },
      });

      // Award points to assignee
      if (task.assigneeId) {
        await db.user.update({
          where: { id: task.assigneeId },
          data: {
            totalPoints: { increment: points },
            weeklyPoints: { increment: points },
            monthlyPoints: { increment: points },
          },
        });
        await db.pointHistory.create({
          data: {
            userId: task.assigneeId,
            amount: points,
            reason: `إتمام المهمة: ${task.title}${isEarly ? " (مبكرًا)" : ""}`,
            source: "task",
          },
        });
      }

      return NextResponse.json({
        success: true,
        task: updated,
        points,
        early: isEarly,
      });
    } else if (action === "assign") {
      if (!isTeamLeader(user.role)) {
        return NextResponse.json(
          { error: "فقط قائد الفريق يمكنه إعادة تكليف المهام" },
          { status: 403 }
        );
      }
      const updated = await db.task.update({
        where: { id },
        data: { assigneeId: body.assigneeId || null },
        include: {
          assignee: { select: { id: true, name: true, department: true } },
          creator: { select: { id: true, name: true } },
        },
      });
      return NextResponse.json({ success: true, task: updated });
    } else if (action === "cancel") {
      if (!isTeamLeader(user.role)) {
        return NextResponse.json(
          { error: "فقط قائد الفريق يمكنه إلغاء المهام" },
          { status: 403 }
        );
      }
      const updated = await db.task.update({
        where: { id },
        data: { status: "CANCELLED" },
      });
      return NextResponse.json({ success: true, task: updated });
    } else {
      return NextResponse.json({ error: "إجراء غير صالح" }, { status: 400 });
    }
  } catch (e) {
    console.error("Task PATCH error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث المهمة" },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE /api/tasks/[id] — Delete a task (Team Leader only)
// ============================================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isTeamLeader(user.role)) {
      return NextResponse.json(
        { error: "فقط قائد الفريق يمكنه حذف المهام" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await db.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Task DELETE error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف المهمة" },
      { status: 500 }
    );
  }
}
