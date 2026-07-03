import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        title: user.title,
        avatar: user.avatar,
        totalPoints: user.totalPoints,
        weeklyPoints: user.weeklyPoints,
        monthlyPoints: user.monthlyPoints,
      },
    });
  } catch (e) {
    console.error("Get current user error:", e);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
