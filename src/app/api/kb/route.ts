import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isSeniorOrAbove } from "@/lib/auth";

// ============================================================
// GET /api/kb?category=PLAYBOOK|TEMPLATE|...
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");

    const where: any = {};
    if (category && category !== "all") {
      where.category = category;
    }

    const entries = await db.kBEntry.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ entries });
  } catch (e) {
    console.error("KB GET error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب المقالات" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/kb — Create a KB entry (Senior+ only)
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    if (!isSeniorOrAbove(user.role)) {
      return NextResponse.json(
        { error: "فقط كبار التسويقيين أو قائد الفريق يمكنهم إضافة المقالات" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, url, category, summary, tags } = body;

    if (!title || !url || !category) {
      return NextResponse.json(
        { error: "العنوان والرابط والفئة مطلوبة" },
        { status: 400 }
      );
    }

    const entry = await db.kBEntry.create({
      data: {
        title,
        url,
        category,
        summary: summary || null,
        tags: tags || "",
        creatorId: user.id,
      },
      include: {
        creator: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, entry });
  } catch (e) {
    console.error("KB POST error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة المقال" },
      { status: 500 }
    );
  }
}
