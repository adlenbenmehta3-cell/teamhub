import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { POINTS_CONFIG } from "@/lib/points";

/**
 * POST /api/kudos
 * Body: { toId, reason }
 * Give kudos to a teammate (+2 points for them).
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const { toId, reason } = body;

    if (!toId || !reason) {
      return NextResponse.json(
        { error: "العضو والسبب مطلوبان" },
        { status: 400 }
      );
    }

    if (toId === user.id) {
      return NextResponse.json(
        { error: "لا يمكنك إعطاء تقدير لنفسك" },
        { status: 400 }
      );
    }

    const target = await db.user.findUnique({ where: { id: toId } });
    if (!target) {
      return NextResponse.json({ error: "العضو غير موجود" }, { status: 404 });
    }

    const points = POINTS_CONFIG.kudos_received;

    const kudos = await db.kudos.create({
      data: {
        fromId: user.id,
        toId,
        reason,
        points,
      },
      include: {
        from: { select: { name: true } },
        to: { select: { name: true } },
      },
    });

    // Add points to recipient
    await db.user.update({
      where: { id: toId },
      data: {
        totalPoints: { increment: points },
        weeklyPoints: { increment: points },
        monthlyPoints: { increment: points },
      },
    });

    await db.pointHistory.create({
      data: {
        userId: toId,
        amount: points,
        reason: `تقدير من ${user.name}: ${reason}`,
        source: "kudos",
      },
    });

    return NextResponse.json({ success: true, kudos, points });
  } catch (e) {
    console.error("Kudos error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إرسال التقدير" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/kudos — Get recent kudos
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const kudos = await db.kudos.findMany({
      include: {
        from: { select: { id: true, name: true, avatar: true } },
        to: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return NextResponse.json({ kudos });
  } catch (e) {
    console.error("Kudos GET error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب التقديرات" },
      { status: 500 }
    );
  }
}
