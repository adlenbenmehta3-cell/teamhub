"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MessageSquare,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Send,
  Languages,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";
import {
  formatArabicDateTime,
  formatEnglishDateTime,
  formatArabicDate,
  formatEnglishDate,
} from "@/lib/auth-labels";
import type { User } from "@/app/page";

interface Props {
  user: User;
}

export function NotesModule({ user }: Props) {
  const { t, lang } = useLanguage();
  const [notes, setNotes] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form
  const [recipientId, setRecipientId] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sourceLang, setSourceLang] = useState(lang);

  const formatDate = lang === "ar" ? formatArabicDate : formatEnglishDate;
  const formatDateTime =
    lang === "ar" ? formatArabicDateTime : formatEnglishDateTime;

  useEffect(() => {
    loadNotes();
    loadTeam();
  }, []);

  const loadNotes = async () => {
    try {
      const res = await fetch("/api/notes");
      const data = await res.json();
      setNotes(data.notes || []);
    } finally {
      setLoading(false);
    }
  };

  const loadTeam = async () => {
    const res = await fetch("/api/team");
    const data = await res.json();
    // Exclude admin from recipient list
    setTeam((data.members || []).filter((m: any) => m.role !== "TEAM_LEADER"));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId || !title || !content) {
      toast.error(
        lang === "ar"
          ? "يرجى تعبئة جميع الحقول"
          : "Please fill in all fields"
      );
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId, title, content, sourceLang }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success(
        lang === "ar"
          ? "تم إرسال الملاحظة (مع الترجمة التلقائية)"
          : "Note sent (with auto-translation)"
      );
      setCreateOpen(false);
      setRecipientId("");
      setTitle("");
      setContent("");
      loadNotes();
    } catch {
      toast.error(
        lang === "ar" ? "فشل إرسال الملاحظة" : "Failed to send note"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(lang === "ar" ? "حذف هذه الملاحظة؟" : "Delete this note?"))
      return;
    try {
      const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed");
        return;
      }
      toast.success(
        lang === "ar" ? "تم الحذف" : "Deleted"
      );
      loadNotes();
    } catch {
      toast.error("Failed");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            {t("notes.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("notes.subtitle")}
          </p>
        </div>

        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="w-4 h-4 ml-2" />
          {t("notes.new")}
        </Button>
      </div>

      {/* Info banner */}
      <div className="p-3 rounded-md border border-primary/20 bg-primary/5 flex items-start gap-2">
        <Languages className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-xs text-foreground/80">
          {lang === "ar"
            ? "الملاحظات تُترجم تلقائياً. اكتب بأي لغة وسيستلمها العامل بلغته المختارة."
            : "Notes are auto-translated. Write in any language and the worker receives it in their chosen language."}
        </p>
      </div>

      {/* Notes List */}
      {notes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">{t("notes.noNotes")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id}>
              <CardContent className="pt-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={
                          note.read
                            ? "bg-muted text-muted-foreground border-border"
                            : "bg-primary/10 text-primary border-primary/30"
                        }
                      >
                        {note.read ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 ml-1" />
                            {t("notes.read")}
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 ml-1" />
                            {t("notes.unread")}
                          </>
                        )}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {lang === "ar" ? "إلى:" : "To:"} {note.recipient?.name}
                      </Badge>
                      {note.recipient?.title && (
                        <span className="text-xs text-muted-foreground">
                          {note.recipient.title}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold mb-1">{note.title}</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line mb-2">
                      {note.content}
                    </p>

                    {/* Show translations */}
                    <div className="mt-2 space-y-1">
                      {note.sourceLang === "en" && note.translatedAr && (
                        <div className="p-2 rounded-md bg-muted/30">
                          <p className="text-xs font-medium text-muted-foreground mb-0.5 flex items-center gap-1">
                            <Languages className="w-3 h-3" />
                            {lang === "ar" ? "الترجمة العربية:" : "Arabic translation:"}
                          </p>
                          <p className="text-xs text-foreground whitespace-pre-line" dir="rtl">
                            {note.translatedAr}
                          </p>
                        </div>
                      )}
                      {note.sourceLang === "ar" && note.translatedEn && (
                        <div className="p-2 rounded-md bg-muted/30">
                          <p className="text-xs font-medium text-muted-foreground mb-0.5 flex items-center gap-1">
                            <Languages className="w-3 h-3" />
                            {lang === "ar" ? "الترجمة الإنجليزية:" : "English translation:"}
                          </p>
                          <p className="text-xs text-foreground whitespace-pre-line" dir="ltr">
                            {note.translatedEn}
                          </p>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDateTime(note.createdAt)}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/5 flex-shrink-0"
                    onClick={() => handleDelete(note.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Note Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              {t("notes.createTitle")}
            </DialogTitle>
            <DialogDescription>{t("notes.createDesc")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="recipient">
                {t("notes.recipient")} *
              </Label>
              <Select value={recipientId} onValueChange={setRecipientId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("notes.recipientPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {team.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                      {m.title && ` (${m.title})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">{t("notes.titleLabel")} *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("notes.titlePlaceholder")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">{t("notes.contentLabel")} *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("notes.contentPlaceholder")}
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sourceLang">
                {t("notes.writeLang")}
              </Label>
              <Select value={sourceLang} onValueChange={setSourceLang}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ar">
                    {lang === "ar" ? "العربية" : "Arabic"}
                  </SelectItem>
                  <SelectItem value="en">
                    {lang === "ar" ? "الإنجليزية" : "English"}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("notes.writeLangHint")}
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={creating}
              >
                {creating ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
                    {t("notes.translating")}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    {t("notes.send")}
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
