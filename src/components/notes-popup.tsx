"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Languages, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";
import {
  formatArabicDateTime,
  formatEnglishDateTime,
} from "@/lib/auth-labels";
import type { User } from "@/app/page";

interface Props {
  user: User;
}

interface Note {
  id: string;
  title: string;
  content: string;
  sourceLang: string;
  translatedAr: string | null;
  translatedEn: string | null;
  read: boolean;
  createdAt: string;
  author: { id: string; name: string };
}

export function NotesPopup({ user }: Props) {
  const { t, lang } = useLanguage();
  const [unreadNotes, setUnreadNotes] = useState<Note[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [marking, setMarking] = useState(false);

  // Only show for workers (non-admin)
  const isWorker = user.role !== "TEAM_LEADER";

  useEffect(() => {
    if (!isWorker) return;
    // Small delay to let the dashboard load first
    const timer = setTimeout(() => {
      loadUnreadNotes();
    }, 1500);
    return () => clearTimeout(timer);
  }, [isWorker, user.id]);

  const loadUnreadNotes = async () => {
    try {
      const res = await fetch("/api/notes/unread");
      const data = await res.json();
      if (data.count > 0) {
        setUnreadNotes(data.notes);
        setOpen(true);
      }
    } catch {
      // ignore
    }
  };

  const handleMarkRead = async () => {
    const note = unreadNotes[currentIndex];
    if (!note) return;
    setMarking(true);
    try {
      await fetch(`/api/notes/${note.id}`, { method: "PATCH" });
      // Move to next note or close
      if (currentIndex < unreadNotes.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setOpen(false);
      }
    } catch {
      // ignore
    } finally {
      setMarking(false);
    }
  };

  if (!isWorker || unreadNotes.length === 0) return null;

  const note = unreadNotes[currentIndex];
  if (!note) return null;

  // Show the translation in the worker's language, fall back to original
  const displayContent =
    lang === "ar"
      ? note.translatedAr || note.content
      : note.translatedEn || note.content;

  const formatDateTime =
    lang === "ar" ? formatArabicDateTime : formatEnglishDateTime;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            {t("notes.popupTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("notes.popupFrom", { name: note.author?.name || "Admin" })}
            {" • "}
            {formatDateTime(note.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Note title */}
          <h3 className="font-semibold text-lg">{note.title}</h3>

          {/* Note content (translated) */}
          <div className="p-3 rounded-md border border-border bg-muted/30">
            <p className="text-sm text-foreground whitespace-pre-line" dir={lang === "ar" ? "rtl" : "ltr"}>
              {displayContent}
            </p>
          </div>

          {/* Show original if translation was used */}
          {((lang === "ar" && note.sourceLang === "en") ||
            (lang === "en" && note.sourceLang === "ar")) && (
            <div className="p-2 rounded-md bg-muted/20">
              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <Languages className="w-3 h-3" />
                {t("notes.originalText")}
              </p>
              <p className="text-xs text-muted-foreground whitespace-pre-line" dir={note.sourceLang === "ar" ? "rtl" : "ltr"}>
                {note.content}
              </p>
            </div>
          )}

          {/* Counter */}
          {unreadNotes.length > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline" className="text-xs">
                {currentIndex + 1} / {unreadNotes.length}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            onClick={handleMarkRead}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={marking}
          >
            <CheckCircle2 className="w-4 h-4 ml-2" />
            {t("notes.markRead")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
