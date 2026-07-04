import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchemaUpToDate } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/work-plans/today
 * Returns today's checklist for the current user.
 * For each active work plan assigned to the user (or all plans for TL),
 * returns the items + today's completion status + Drive links.
 */
export async function GET() {
  try {
    await ensureSchemaUpToDate();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const now = new Date();

    // Get active work plans
    const where: any = {
      active: true,
      startDate: { lte: now },
      endDate: { gte: now },
    };
    if (user.role !== "TEAM_LEADER") {
      where.assigneeId = user.id;
    }

    const workPlans = await db.workPlan.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, department: true } },
        items: { orderBy: { order: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    // For TL viewing all plans, we need to get completions for each plan's assignee
    // For workers, we get their own completions
    const result = [];

    for (const wp of workPlans) {
      const targetUserId = wp.assigneeId || user.id;

      // Get today's completions for this plan's items
      const completions = await db.dailyCompletion.findMany({
        where: {
          userId: targetUserId,
          date: today,
          workPlanItem: { workPlanId: wp.id },
        },
      });

      const completionMap = new Map(
        completions.map((c) => [c.workPlanItemId, c])
      );

      const itemsWithStatus = wp.items.map((item) => {
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
          completionId: completion?.id || null,
        };
      });

      const completedCount = itemsWithStatus.filter((i) => i.completed).length;

      result.push({
        id: wp.id,
        title: wp.title,
        description: wp.description,
        startDate: wp.startDate,
        endDate: wp.endDate,
        assignee: wp.assignee,
        items: itemsWithStatus,
        totalItems: wp.items.length,
        completedItems: completedCount,
        progress:
          wp.items.length > 0
            ? Math.round((completedCount / wp.items.length) * 100)
            : 0,
      });
    }

    return NextResponse.json({
      date: today,
      workPlans: result,
    });
  } catch (e) {
    console.error("Today work plans error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب قائمة اليوم" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/work-plans/today
 * Update today's completion for a specific item.
 * Body: { workPlanItemId, completed, driveLink?, notes? }
 */
export async function POST(req: NextRequest) {
  try {
    await ensureSchemaUpToDate();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const { workPlanItemId, completed, driveLink, notes } = body;

    if (!workPlanItemId) {
      return NextResponse.json(
        { error: "معرف العنصر مطلوب" },
        { status: 400 }
      );
    }

    // Validate Drive link if provided
    let normalizedDriveLink: string | null = null;
    if (driveLink && driveLink.trim()) {
      const trimmed = driveLink.trim();
      try {
        new URL(trimmed);
        normalizedDriveLink = trimmed;
      } catch {
        return NextResponse.json(
          { error: "رابط Google Drive غير صالح" },
          { status: 400 }
        );
      }
    }

    const today = new Date().toISOString().split("T")[0];

    // Verify the item exists and the user has access
    const item = await db.workPlanItem.findUnique({
      where: { id: workPlanItemId },
      include: { workPlan: true },
    });

    if (!item) {
      return NextResponse.json(
        { error: "العنصر غير موجود" },
        { status: 404 }
      );
    }

    // Workers can only update their own assigned plans
    if (
      user.role !== "TEAM_LEADER" &&
      item.workPlan.assigneeId !== user.id
    ) {
      return NextResponse.json(
        { error: "غير مصرح بتعديل هذا العنصر" },
        { status: 403 }
      );
    }

    // Target user: the plan's assignee, or the current user if TL
    const targetUserId = item.workPlan.assigneeId || user.id;

    // Upsert the daily completion
    const completion = await db.dailyCompletion.upsert({
      where: {
        workPlanItemId_userId_date: {
          workPlanItemId,
          userId: targetUserId,
          date: today,
        },
      },
      create: {
        workPlanItemId,
        userId: targetUserId,
        date: today,
        completed: completed || false,
        driveLink: normalizedDriveLink,
        notes: notes || null,
        completedAt: completed ? new Date() : null,
      },
      update: {
        completed: completed ?? undefined,
        driveLink: driveLink !== undefined ? normalizedDriveLink : undefined,
        notes: notes !== undefined ? notes : undefined,
        completedAt: completed ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, completion });
  } catch (e) {
    console.error("Update completion error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث الإنجاز" },
      { status: 500 }
    );
  }
}
