import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isTeamLeader } from "@/lib/auth";
import { hashPasswordForStorage } from "@/lib/auth";

// ============================================================
// GET /api/team — List all team members
// ============================================================

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const members = await db.user.findMany({
      where: { active: true },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        title: true,
        phone: true,
        totalPoints: true,
        weeklyPoints: true,
        monthlyPoints: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ members });
  } catch (e) {
    console.error("Team GET error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء جلب أعضاء الفريق" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/team — Add a new member (Team Leader only)
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !isTeamLeader(user.role)) {
      return NextResponse.json(
        { error: "فقط قائد الفريق يمكنه إضافة أعضاء" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, password, role, department, title, phone } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "الاسم والبريد وكلمة المرور مطلوبة" },
        { status: 400 }
      );
    }

    // Check if email exists
    const existing = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مستخدم بالفعل" },
        { status: 400 }
      );
    }

    const hashedPassword = await hashPasswordForStorage(password);

    const newMember = await db.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        role: role || "JUNIOR_MARKETER",
        department: department || "GENERAL",
        title: title || null,
        phone: phone || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        title: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, member: newMember });
  } catch (e) {
    console.error("Team POST error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إضافة العضو" },
      { status: 500 }
    );
  }
}
