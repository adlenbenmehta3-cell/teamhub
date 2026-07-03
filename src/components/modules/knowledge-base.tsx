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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Plus,
  ExternalLink,
  FileText,
  LayoutTemplate,
  Palette,
  Wrench,
  CaseSensitive,
  HelpCircle,
} from "lucide-react";
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

const CATEGORY_ICONS: Record<string, any> = {
  PLAYBOOK: FileText,
  TEMPLATE: LayoutTemplate,
  BRAND_GUIDE: Palette,
  TOOL_TUTORIAL: Wrench,
  CASE_STUDY: CaseSensitive,
  FAQ: HelpCircle,
};

export function KnowledgeBaseModule({ user }: Props) {
  const { t, lang } = useLanguage();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("PLAYBOOK");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");

  const canManage =
    user.role === "TEAM_LEADER" || user.role === "SENIOR_MARKETER";

  const categoryLabels: Record<string, string> = {
    PLAYBOOK: t("kb.category.playbook"),
    TEMPLATE: t("kb.category.template"),
    BRAND_GUIDE: t("kb.category.brand_guide"),
    TOOL_TUTORIAL: t("kb.category.tool_tutorial"),
    CASE_STUDY: t("kb.category.case_study"),
    FAQ: t("kb.category.faq"),
  };

  const timeAgo = lang === "ar" ? timeAgoArabic : timeAgoEnglish;

  useEffect(() => {
    loadEntries();
  }, [filter]);

  const loadEntries = async () => {
    try {
      const res = await fetch(
        `/api/kb${filter !== "all" ? `?category=${filter}` : ""}`
      );
      const data = await res.json();
      setEntries(data.entries || []);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !url || !category) {
      toast.error(t("kb.fillRequired"));
      return;
    }
    try {
      const res = await fetch("/api/kb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, url, category, summary, tags }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success(t("kb.added"));
      setCreateOpen(false);
      setTitle("");
      setUrl("");
      setCategory("PLAYBOOK");
      setSummary("");
      setTags("");
      loadEntries();
    } catch {
      toast.error(t("kb.addFailed"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("kb.deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/kb/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error(t("kb.deleteFailed"));
        return;
      }
      toast.success(t("kb.deleted"));
      loadEntries();
    } catch {
      toast.error(t("kb.deleteFailed"));
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
            {t("kb.title")}
          </h1>
          <p className="text-muted-foreground mt-1">{t("kb.subtitle")}</p>
        </div>

        {canManage && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                <Plus className="w-4 h-4 ml-2" />
                {t("kb.new")}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("kb.createTitle")}</DialogTitle>
                <DialogDescription>{t("kb.createDesc")}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t("kb.title.label")} *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("kb.title.placeholder")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">{t("kb.url.label")} *</Label>
                  <Input
                    id="url"
                    type="url"
                    dir="ltr"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t("kb.url.placeholder")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">{t("kb.category.label")} *</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLAYBOOK">
                        {t("kb.category.playbook")}
                      </SelectItem>
                      <SelectItem value="TEMPLATE">
                        {t("kb.category.template")}
                      </SelectItem>
                      <SelectItem value="BRAND_GUIDE">
                        {t("kb.category.brand_guide")}
                      </SelectItem>
                      <SelectItem value="TOOL_TUTORIAL">
                        {t("kb.category.tool_tutorial")}
                      </SelectItem>
                      <SelectItem value="CASE_STUDY">
                        {t("kb.category.case_study")}
                      </SelectItem>
                      <SelectItem value="FAQ">
                        {t("kb.category.faq")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="summary">{t("kb.summary.label")}</Label>
                  <Textarea
                    id="summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder={t("kb.summary.placeholder")}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tags">{t("kb.tags.label")}</Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder={t("kb.tags.placeholder")}
                    dir="ltr"
                  />
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
                    {t("kb.add")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
          className={
            filter === "all"
              ? "bg-emerald-600 hover:bg-emerald-700"
              : "border-emerald-200 text-emerald-700"
          }
        >
          {t("kb.all")} ({entries.length})
        </Button>
        {Object.entries(categoryLabels).map(([key, label]) => {
          const count = entries.filter((e) => e.category === key).length;
          return (
            <Button
              key={key}
              size="sm"
              variant={filter === key ? "default" : "outline"}
              onClick={() => setFilter(key)}
              className={
                filter === key
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "border-emerald-200 text-emerald-700"
              }
            >
              {label} ({count})
            </Button>
          );
        })}
      </div>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {filter === "all"
                ? t("kb.noEntries")
                : t("kb.noEntriesFiltered", {
                    category: categoryLabels[filter] || filter,
                  })}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {entries
            .filter((e) => filter === "all" || e.category === filter)
            .map((entry) => {
              const Icon = CATEGORY_ICONS[entry.category] || BookOpen;
              return (
                <Card
                  key={entry.id}
                  className="border-emerald-100 hover:shadow-md transition-shadow"
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge
                            variant="outline"
                            className="border-emerald-200 text-emerald-700 bg-emerald-50 text-xs"
                          >
                            {categoryLabels[entry.category]}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-emerald-900 mb-1">
                          {entry.title}
                        </h3>
                        {entry.summary && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {entry.summary}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-3">
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                            dir="ltr"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {t("kb.openLink")}
                          </a>
                          <span className="text-xs text-muted-foreground">
                            {entry.creator?.name} • {timeAgo(entry.createdAt)}
                          </span>
                        </div>
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 text-red-600 hover:bg-red-50 text-xs h-7"
                            onClick={() => handleDelete(entry.id)}
                          >
                            {t("kb.delete")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}
    </div>
  );
}
