import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isTeamLeader } from "@/lib/auth";

/**
 * PATCH /api/team/[id]
 * Body: { name?, role?, department?, title?, phone?, active?, password? }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !isTeamLeader(currentUser.role)) {
      return NextResponse.json(
        { error: "فقط قائد الفريق يمكنه تعديل الأعضاء" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await req.json();
    const { name, role, department, title, phone, active, password } = body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (role !== undefined) data.role = role;
    if (department !== undefined) data.department = department;
    if (title !== undefined) data.title = title;
    if (phone !== undefined) data.phone = phone;
    if (active !== undefined) data.active = active;

    if (password) {
      const { hashPasswordForStorage } = await import("@/lib/auth");
      data.password = await hashPasswordForStorage(password);
    }

    const updated = await db.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        title: true,
        phone: true,
        active: true,
      },
    });

    return NextResponse.json({ success: true, member: updated });
  } catch (e) {
    console.error("Team PATCH error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء تحديث العضو" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !isTeamLeader(currentUser.role)) {
      return NextResponse.json(
        { error: "فقط قائد الفريق يمكنه حذف الأعضاء" },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (id === currentUser.id) {
      return NextResponse.json(
        { error: "لا يمكنك حذف حسابك الخاص" },
        { status: 400 }
      );
    }

    // Soft delete — mark as inactive
    await db.user.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Team DELETE error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف العضو" },
      { status: 500 }
    );
  }
}
