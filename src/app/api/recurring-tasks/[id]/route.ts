import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isTeamLeader } from "@/lib/auth";

/**
 * PATCH /api/recurring-tasks/[id]
 * Body: { action: "deactivate" | "extend", endDate? }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isTeamLeader(user.role)) {
      return NextResponse.json(
        { error: "فقط قائد الفريق يمكنه تعديل المهام المتكررة" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { action, endDate } = body;

    const recurringTask = await db.recurringTask.findUnique({ where: { id } });
    if (!recurringTask) {
      return NextResponse.json(
        { error: "المهمة المتكررة غير موجودة" },
        { status: 404 }
      );
    }

    if (action === "deactivate") {
      // Deactivate: stop generating new instances, but keep existing ones
      const updated = await db.recurringTask.update({
        where: { id },
        data: { active: false },
      });
      return NextResponse.json({ success: true, recurringTask: updated });
    } else if (action === "extend") {
      // Extend: update end date and generate new instances
      if (!endDate) {
        return NextResponse.json(
          { error: "تاريخ الانتهاء الجديد مطلوب" },
          { status: 400 }
        );
      }
      const newEnd = new Date(endDate);
      if (newEnd <= recurringTask.endDate) {
        return NextResponse.json(
          { error: "تاريخ الانتهاء الجديد يجب أن يكون بعد التاريخ الحالي" },
          { status: 400 }
        );
      }

      const updated = await db.recurringTask.update({
        where: { id },
        data: { endDate: newEnd },
      });

      // Generate any missing instances between old end and new end
      // (The generate endpoint will handle this)
      return NextResponse.json({ success: true, recurringTask: updated });
    } else {
      return NextResponse.json({ error: "إجراء غير صالح" }, { status: 400 });
    }
  } catch (e) {
    console.error("Recurring task PATCH error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث المهمة المتكررة" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/recurring-tasks/[id]
 * Deactivate the recurring task AND delete all future uncompleted instances.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isTeamLeader(user.role)) {
      return NextResponse.json(
        { error: "فقط قائد الفريق يمكنه حذف المهام المتكررة" },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Delete all uncompleted future instances
    await db.task.deleteMany({
      where: {
        recurringTaskId: id,
        status: "OPEN",
        deadline: { gte: new Date() },
      },
    });

    // Deactivate the recurring task
    await db.recurringTask.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Recurring task DELETE error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف المهمة المتكررة" },
      { status: 500 }
    );
  }
}
