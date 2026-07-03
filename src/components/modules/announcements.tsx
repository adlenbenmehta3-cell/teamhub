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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Megaphone, Plus, Pin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";
import {
  timeAgoArabic,
  timeAgoEnglish,
} from "@/lib/auth-labels";
import type { User } from "@/app/page";

interface Props {
  user: User;
}

export function AnnouncementsModule({ user }: Props) {
  const { t, lang } = useLanguage();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);

  const isTL = user.role === "TEAM_LEADER";
  const timeAgo = lang === "ar" ? timeAgoArabic : timeAgoEnglish;

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const res = await fetch("/api/announcements");
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      toast.error(t("announcements.fillRequired"));
      return;
    }
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, pinned }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success(t("announcements.published"));
      setCreateOpen(false);
      setTitle("");
      setContent("");
      setPinned(false);
      loadAnnouncements();
    } catch {
      toast.error(t("announcements.publishFailed"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("announcements.deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/announcements/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error(t("announcements.deleteFailed"));
        return;
      }
      toast.success(t("announcements.deleted"));
      loadAnnouncements();
    } catch {
      toast.error(t("announcements.deleteFailed"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-emerald-900">
            {t("announcements.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("announcements.subtitle")}
          </p>
        </div>

        {isTL && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                <Plus className="w-4 h-4 ml-2" />
                {t("announcements.new")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {t("announcements.createTitle")}
                </DialogTitle>
                <DialogDescription>
                  {t("announcements.createDesc")}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    {t("announcements.title.label")} *
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("announcements.title.placeholder")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">
                    {t("announcements.content.label")} *
                  </Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t("announcements.content.placeholder")}
                    rows={6}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="pinned"
                    checked={pinned}
                    onChange={(e) => setPinned(e.target.checked)}
                    className="w-4 h-4 rounded border-emerald-200"
                  />
                  <Label
                    htmlFor="pinned"
                    className="text-sm cursor-pointer"
                  >
                    {t("announcements.pinned")}
                  </Label>
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
                    className="bg-gradient-to-r from-emerald-600 to-teal-600"
                  >
                    {t("announcements.publish")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Megaphone className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {t("announcements.noAnnouncements")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <Card
              key={a.id}
              className={
                a.pinned
                  ? "border-emerald-300 bg-emerald-50/30"
                  : "border-emerald-100"
              }
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      {a.pinned && (
                        <Badge
                          variant="outline"
                          className="border-emerald-300 text-emerald-700 bg-emerald-100"
                        >
                          <Pin className="w-3 h-3 ml-1" />
                          {t("announcements.pinned.label")}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {a.creator?.name} • {timeAgo(a.createdAt)}
                      </span>
                    </div>
                    <h3 className="font-bold text-emerald-900 text-lg mb-2">
                      {a.title}
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {a.content}
                    </p>
                  </div>

                  {isTL && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:bg-red-50 flex-shrink-0"
                      onClick={() => handleDelete(a.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
