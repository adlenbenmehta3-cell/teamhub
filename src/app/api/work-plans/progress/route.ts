import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchemaUpToDate } from "@/lib/db";
import { getCurrentUser, isTeamLeader } from "@/lib/auth";

/**
 * GET /api/work-plans/progress?workPlanId=X&date=YYYY-MM-DD
 * Returns all completions for a specific work plan on a specific date.
 * TL only — used to review worker progress.
 */
export async function GET(req: NextRequest) {
  try {
    await ensureSchemaUpToDate();
    const user = await getCurrentUser();
    if (!user || !isTeamLeader(user.role)) {
      return NextResponse.json(
        { error: "فقط قائد الفريق يمكنه عرض التقدم" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const workPlanId = searchParams.get("workPlanId");
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

    if (!workPlanId) {
      return NextResponse.json(
        { error: "معرف خطة العمل مطلوب" },
        { status: 400 }
      );
    }

    const workPlan = await db.workPlan.findUnique({
      where: { id: workPlanId },
      include: {
        assignee: { select: { id: true, name: true, department: true } },
        items: { orderBy: { order: "asc" } },
      },
    });

    if (!workPlan) {
      return NextResponse.json(
        { error: "خطة العمل غير موجودة" },
        { status: 404 }
      );
    }

    // Get all completions for this plan on the given date
    const completions = await db.dailyCompletion.findMany({
      where: {
        date,
        workPlanItem: { workPlanId },
      },
    });

    const completionMap = new Map(
      completions.map((c) => [c.workPlanItemId, c])
    );

    const itemsWithStatus = workPlan.items.map((item) => {
      const completion = completionMap.get(item.id);
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        order: item.order,
        completed: completion?.completed || false,
        driveLink: completion?.driveLink || null,
        notes: completion?.notes || null,
        completedAt: completion?.completedAt || null,
      };
    });

    const completedCount = itemsWithStatus.filter((i) => i.completed).length;

    return NextResponse.json({
      workPlan: {
        id: workPlan.id,
        title: workPlan.title,
        description: workPlan.description,
        assignee: workPlan.assignee,
        startDate: workPlan.startDate,
        endDate: workPlan.endDate,
      },
      date,
      items: itemsWithStatus,
      totalItems: workPlan.items.length,
      completedItems: completedCount,
      progress:
        workPlan.items.length > 0
          ? Math.round((completedCount / workPlan.items.length) * 100)
          : 0,
    });
  } catch (e) {
    console.error("Progress GET error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب التقدم" },
      { status: 500 }
    );
  }
}
