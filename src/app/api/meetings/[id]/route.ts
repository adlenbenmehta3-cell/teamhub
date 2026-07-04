import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isTeamLeader } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !isTeamLeader(user.role)) {
      return NextResponse.json(
        { error: "فقط قائد الفريق يمكنه حذف الاجتماعات" },
        { status: 403 }
      );
    }
    const { id } = await params;
    await db.meeting.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Meeting DELETE error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حذف الاجتماع" },
      { status: 500 }
    );
  }
}
