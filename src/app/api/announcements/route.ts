import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isTeamLeader } from "@/lib/auth";

// ============================================================
// GET /api/announcements
// ============================================================

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const announcements = await db.announcement.findMany({
      include: {
        creator: { select: { id: true, name: true } },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 50,
    });

    return NextResponse.json({ announcements });
  } catch (e) {
    console.error("Announcements GET error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الإعلانات" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/announcements (Team Leader only)
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isTeamLeader(user.role)) {
      return NextResponse.json(
        { error: "فقط قائد الفريق يمكنه نشر الإعلانات" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, content, pinned } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "العنوان والمحتوى مطلوبان" },
        { status: 400 }
      );
    }

    const announcement = await db.announcement.create({
      data: {
        title,
        content,
        pinned: pinned || false,
        creatorId: user.id,
      },
      include: {
        creator: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, announcement });
  } catch (e) {
    console.error("Announcement POST error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء نشر الإعلان" },
      { status: 500 }
    );
  }
}
