import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isSeniorOrAbove } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isSeniorOrAbove(user.role)) {
      return NextResponse.json(
        { error: "غير مصرح بحذف المقالات" },
        { status: 403 }
      );
    }
    const { id } = await params;
    await db.kBEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("KB DELETE error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف المقال" },
      { status: 500 }
    );
  }
}
