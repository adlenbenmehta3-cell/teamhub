import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/leaderboard?period=weekly|monthly|total
 * Returns top 10 performers.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "weekly";

    let orderByField = "weeklyPoints";
    if (period === "monthly") orderByField = "monthlyPoints";
    else if (period === "total") orderByField = "totalPoints";

    const top = await db.user.findMany({
      where: { active: true },
      orderBy: { [orderByField]: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        department: true,
        role: true,
        totalPoints: true,
        weeklyPoints: true,
        monthlyPoints: true,
        avatar: true,
      },
    });

    return NextResponse.json({ leaderboard: top, period });
  } catch (e) {
    console.error("Leaderboard error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب لوحة المتصدرين" },
      { status: 500 }
    );
  }
}
