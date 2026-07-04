import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isTeamLeader } from "@/lib/auth";

// ============================================================
// GET /api/meetings — List upcoming and past meetings
// ============================================================

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") || "upcoming"; // upcoming, past, all

    const now = new Date();
    const where: any = {};
    if (filter === "upcoming") {
      where.datetime = { gte: now };
    } else if (filter === "past") {
      where.datetime = { lt: now };
    }

    const meetings = await db.meeting.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true } },
        attendees: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
      orderBy: { datetime: filter === "past" ? "desc" : "asc" },
      take: 50,
    });

    return NextResponse.json({ meetings });
  } catch (e) {
    console.error("Meetings GET error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب الاجتماعات" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/meetings — Schedule a meeting (Team Leader only)
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    if (!isTeamLeader(user.role)) {
      return NextResponse.json(
        { error: "فقط قائد الفريق يمكنه جدولة الاجتماعات" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, datetime, durationMin, type, agenda, location } = body;

    if (!title || !datetime) {
      return NextResponse.json(
        { error: "العنوان والوقت مطلوبان" },
        { status: 400 }
      );
    }

    const meeting = await db.meeting.create({
      data: {
        title,
        description: description || null,
        datetime: new Date(datetime),
        durationMin: durationMin || 30,
        type: type || "GENERAL",
        agenda: agenda || null,
        location: location || "قاعة الاجتماعات",
        creatorId: user.id,
      },
      include: {
        creator: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, meeting });
  } catch (e) {
    console.error("Meeting POST error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جدولة الاجتماع" },
      { status: 500 }
    );
  }
}
