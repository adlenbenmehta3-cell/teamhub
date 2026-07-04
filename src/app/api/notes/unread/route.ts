import { NextResponse } from "next/server";
import { db, ensureSchemaUpToDate } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/notes/unread — Returns unread notes for the current user (workers)
 * Used by the notification popup on login
 */
export async function GET() {
  try {
    await ensureSchemaUpToDate();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const unreadNotes = await db.workerNote.findMany({
      where: {
        recipientId: user.id,
        read: false,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      count: unreadNotes.length,
      notes: unreadNotes,
    });
  } catch (e) {
    console.error("Unread notes error:", e);
    return NextResponse.json(
      { error: "Failed to load unread notes" },
      { status: 500 }
    );
  }
}
