import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchemaUpToDate } from "@/lib/db";
import { getCurrentUser, isTeamLeader } from "@/lib/auth";

/**
 * GET /api/work-plans/[id]
 * Get a specific work plan with all items.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchemaUpToDate();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;
    const workPlan = await db.workPlan.findUnique({
      where: { id },
      include: {
        assignee: { select: { id: true, name: true, department: true } },
        creator: { select: { id: true, name: true } },
        items: { orderBy: { order: "asc" } },
      },
    });

    if (!workPlan) {
      return NextResponse.json(
        { error: "خطة العمل غير موجودة" },
        { status: 404 }
      );
    }

    // Workers can only see their own plans
    if (!isTeamLeader(user.role) && workPlan.assigneeId !== user.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
    }

    return NextResponse.json({ workPlan });
  } catch (e) {
    console.error("Work plan GET error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب خطة العمل" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/work-plans/[id] — Deactivate a work plan (TL only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchemaUpToDate();
    const user = await getCurrentUser();
    if (!user || !isTeamLeader(user.role)) {
      return NextResponse.json(
        { error: "فقط قائد الفريق يمكنه حذف خطط العمل" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await db.workPlan.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Work plan DELETE error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف خطة العمل" },
      { status: 500 }
    );
  }
}
