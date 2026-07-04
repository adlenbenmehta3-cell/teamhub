import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchemaUpToDate } from "@/lib/db";
import { getCurrentUser, isTeamLeader } from "@/lib/auth";

/**
 * DELETE /api/notes/[id] — Delete a note (Admin only)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchemaUpToDate();
    const user = await getCurrentUser();
    if (!user || !isTeamLeader(user.role)) {
      return NextResponse.json(
        { error: "Only admin can delete notes" },
        { status: 403 }
      );
    }

    const { id } = await params;
    await db.workerNote.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Note DELETE error:", e);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notes/[id] — Mark note as read (worker)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureSchemaUpToDate();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const note = await db.workerNote.findUnique({ where: { id } });
    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Only recipient can mark as read
    if (note.recipientId !== user.id && !isTeamLeader(user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updated = await db.workerNote.update({
      where: { id },
      data: { read: true, readAt: new Date() },
    });

    return NextResponse.json({ success: true, note: updated });
  } catch (e) {
    console.error("Note PATCH error:", e);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 }
    );
  }
}
