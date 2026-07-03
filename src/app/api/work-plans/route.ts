import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchemaUpToDate } from "@/lib/db";
import { getCurrentUser, isTeamLeader } from "@/lib/auth";

// ============================================================
// GET /api/work-plans — List work plans
// TL sees all; workers see only their assigned plans
// ============================================================

export async function GET() {
  try {
    await ensureSchemaUpToDate();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const where: any = { active: true };
    if (!isTeamLeader(user.role)) {
      where.assigneeId = user.id;
    }

    const workPlans = await db.workPlan.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, department: true } },
        creator: { select: { id: true, name: true } },
        items: {
          orderBy: { order: "asc" },
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ workPlans });
  } catch (e) {
    console.error("Work plans GET error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب خطط العمل" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/work-plans — Create a new work plan (TL only)
// Body: {
//   title, description, startDate, endDate, assigneeId?,
//   items: [{ title, description? }, ...]
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
        { error: "فقط قائد الفريق يمكنه إنشاء خطط العمل" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, startDate, endDate, assigneeId, items } = body;

    if (!title || !description || !startDate || !endDate) {
      return NextResponse.json(
        { error: "الحقول المطلوبة ناقصة" },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "يجب إضافة عنصر واحد على الأقل للقائمة" },
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

    // Create the work plan with items
    const workPlan = await db.workPlan.create({
      data: {
        title,
        description,
        startDate: start,
        endDate: end,
        assigneeId: assigneeId || null,
        creatorId: user.id,
        items: {
          create: items.map((item: any, index: number) => ({
            title: item.title,
            description: item.description || null,
            order: index,
          })),
        },
      },
      include: {
        assignee: { select: { id: true, name: true, department: true } },
        creator: { select: { id: true, name: true } },
        items: { orderBy: { order: "asc" } },
      },
    });

    return NextResponse.json({ success: true, workPlan });
  } catch (e) {
    console.error("Work plan POST error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء خطة العمل" },
      { status: 500 }
    );
  }
}
