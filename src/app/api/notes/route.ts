import { NextRequest, NextResponse } from "next/server";
import { db, ensureSchemaUpToDate } from "@/lib/db";
import { getCurrentUser, isTeamLeader } from "@/lib/auth";

// ============================================================
// GET /api/notes — List notes
// Admin: sees all notes they wrote
// Worker: sees all notes addressed to them
// ============================================================

export async function GET() {
  try {
    await ensureSchemaUpToDate();
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let notes;
    if (isTeamLeader(user.role)) {
      // Admin sees all notes they wrote
      notes = await db.workerNote.findMany({
        include: {
          recipient: { select: { id: true, name: true, title: true, department: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Worker sees notes addressed to them
      notes = await db.workerNote.findMany({
        where: { recipientId: user.id },
        include: {
          author: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ notes });
  } catch (e) {
    console.error("Notes GET error:", e);
    return NextResponse.json(
      { error: "Failed to load notes" },
      { status: 500 }
    );
  }
}

// ============================================================
// POST /api/notes — Create a note (Admin only)
// Body: { recipientId, title, content, sourceLang }
// Auto-translates to the other language using AI
// ============================================================

export async function POST(req: NextRequest) {
  try {
    await ensureSchemaUpToDate();
    const user = await getCurrentUser();
    if (!user || !isTeamLeader(user.role)) {
      return NextResponse.json(
        { error: "Only admin can create notes" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { recipientId, title, content, sourceLang } = body;

    if (!recipientId || !title || !content) {
      return NextResponse.json(
        { error: "Recipient, title, and content are required" },
        { status: 400 }
      );
    }

    const lang = sourceLang || "en";

    // Auto-translate using AI
    let translatedAr: string | null = null;
    let translatedEn: string | null = null;

    try {
      const ZAI = (await import("z-ai-web-dev-sdk")).default;
      const zai = await ZAI.create();

      if (lang === "en") {
        // Admin wrote in English → translate to Arabic
        translatedEn = content;
        const result = await zai.chat.completions.create({
          messages: [
            { role: "system", content: "You are a professional translator. Translate the user's text to Arabic. Output only the Arabic translation, nothing else." },
            { role: "user", content: content },
          ],
        });
        translatedAr = result.choices?.[0]?.message?.content?.trim() || content;
      } else {
        // Admin wrote in Arabic → translate to English
        translatedAr = content;
        const result = await zai.chat.completions.create({
          messages: [
            { role: "system", content: "You are a professional translator. Translate the user's text to English. Output only the English translation, nothing else." },
            { role: "user", content: content },
          ],
        });
        translatedEn = result.choices?.[0]?.message?.content?.trim() || content;
      }
    } catch (translateErr) {
      console.error("Translation failed:", translateErr);
      // Fallback: use original content for both
      if (lang === "en") {
        translatedAr = content;
      } else {
        translatedEn = content;
      }
    }

    const note = await db.workerNote.create({
      data: {
        recipientId,
        authorId: user.id,
        title,
        content,
        sourceLang: lang,
        translatedAr,
        translatedEn,
      },
      include: {
        recipient: { select: { id: true, name: true, title: true, department: true } },
      },
    });

    return NextResponse.json({ success: true, note });
  } catch (e) {
    console.error("Note POST error:", e);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
