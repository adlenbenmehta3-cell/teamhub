import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { POINTS_CONFIG } from "@/lib/points";

/**
 * POST /api/meetings/[id]/attend
 * Mark the current user as attended the meeting.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { id } = await params;
    const meeting = await db.meeting.findUnique({ where: { id } });
    if (!meeting) {
      return NextResponse.json({ error: "الاجتماع غير موجود" }, { status: 404 });
    }

    // Check if already marked
    const existing = await db.meetingAttendee.findUnique({
      where: { meetingId_userId: { meetingId: id, userId: user.id } },
    });

    if (existing?.attended) {
      return NextResponse.json(
        { error: "لقد سجّلت حضورك لهذا الاجتماع" },
        { status: 400 }
      );
    }

    const points = POINTS_CONFIG.meeting_attended;

    const attendee = await db.meetingAttendee.upsert({
      where: { meetingId_userId: { meetingId: id, userId: user.id } },
      create: {
        meetingId: id,
        userId: user.id,
        attended: true,
        points,
      },
      update: { attended: true, points },
    });

    // Add points to user
    await db.user.update({
      where: { id: user.id },
      data: {
        totalPoints: { increment: points },
        weeklyPoints: { increment: points },
        monthlyPoints: { increment: points },
      },
    });

    await db.pointHistory.create({
      data: {
        userId: user.id,
        amount: points,
        reason: `حضور اجتماع: ${meeting.title}`,
        source: "meeting",
      },
    });

    return NextResponse.json({ success: true, attendee, points });
  } catch (e) {
    console.error("Meeting attend error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تسجيل الحضور" },
      { status: 500 }
    );
  }
}
