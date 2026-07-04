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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  ClipboardList,
  Plus,
  Trash2,
  Calendar,
  User,
  CheckCircle2,
  Circle,
  ExternalLink,
  Folder,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";
import {
  formatArabicDate,
  formatEnglishDate,
  formatArabicDateTime,
  formatEnglishDateTime,
} from "@/lib/auth-labels";
import type { User as UserType } from "@/app/page";

interface Props {
  user: UserType;
}

interface WorkPlanItem {
  id: string;
  title: string;
  description?: string | null;
  order: number;
  completed: boolean;
  driveLink?: string | null;
  notes?: string | null;
  completedAt?: string | null;
}

interface WorkPlan {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  assignee?: { id: string; name: string; department: string } | null;
  items: WorkPlanItem[];
  totalItems: number;
  completedItems: number;
  progress: number;
}

export function WorkPlansModule({ user }: Props) {
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState("today");
  const [todayPlans, setTodayPlans] = useState<WorkPlan[]>([]);
  const [allPlans, setAllPlans] = useState<WorkPlan[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [progressView, setProgressView] = useState<{
    plan: WorkPlan | null;
    date: string;
    items: any[];
  } | null>(null);

  // Create form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [items, setItems] = useState<
    { title: string; description: string }[]
  >([{ title: "", description: "" }]);

  const isTL = user.role === "TEAM_LEADER";
  const formatDate = lang === "ar" ? formatArabicDate : formatEnglishDate;
  const formatDateTime =
    lang === "ar" ? formatArabicDateTime : formatEnglishDateTime;

  useEffect(() => {
    loadData();
    if (isTL) loadTeam();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === "today") {
        const res = await fetch("/api/work-plans/today");
        const data = await res.json();
        setTodayPlans(data.workPlans || []);
      } else {
        const res = await fetch("/api/work-plans");
        const data = await res.json();
        setAllPlans(data.workPlans || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTeam = async () => {
    const res = await fetch("/api/team");
    const data = await res.json();
    setTeam(data.members || []);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !startDate || !endDate) {
      toast.error(t("workplans.fillRequired"));
      return;
    }
    const validItems = items.filter((i) => i.title.trim());
    if (validItems.length === 0) {
      toast.error(t("workplans.needItems"));
      return;
    }
    try {
      const res = await fetch("/api/work-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          startDate: new Date(startDate).toISOString(),
          endDate: new Date(endDate).toISOString(),
          assigneeId: assigneeId || undefined,
          items: validItems,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success(t("workplans.created"));
      setCreateOpen(false);
      // Reset form
      setTitle("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setAssigneeId("");
      setItems([{ title: "", description: "" }]);
      loadData();
    } catch {
      toast.error(t("workplans.createFailed"));
    }
  };

  const handleToggleComplete = async (
    planId: string,
    itemId: string,
    currentCompleted: boolean
  ) => {
    try {
      const res = await fetch("/api/work-plans/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workPlanItemId: itemId,
          completed: !currentCompleted,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      loadData();
    } catch {
      toast.error(t("workplans.updateFailed"));
    }
  };

  const handleSaveDriveLink = async (
    itemId: string,
    driveLink: string,
    completed: boolean
  ) => {
    try {
      const res = await fetch("/api/work-plans/today", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workPlanItemId: itemId,
          completed: completed || true,
          driveLink,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success(t("workplans.driveLink.saved"));
      loadData();
    } catch {
      toast.error(t("workplans.updateFailed"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("workplans.deleteConfirm"))) return;
    try {
      const res = await fetch(`/api/work-plans/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Failed");
        return;
      }
      toast.success(t("workplans.deleted"));
      loadData();
    } catch {
      toast.error("Failed");
    }
  };

  const handleViewProgress = async (plan: WorkPlan, date: string) => {
    try {
      const res = await fetch(
        `/api/work-plans/progress?workPlanId=${plan.id}&date=${date}`
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      setProgressView({
        plan,
        date,
        items: data.items || [],
      });
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

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            {t("workplans.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isTL
              ? t("workplans.subtitle.leader")
              : t("workplans.subtitle.member")}
          </p>
        </div>

        {isTL && (
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 ml-2" />
            {t("workplans.new")}
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="today">{t("workplans.today")}</TabsTrigger>
          <TabsTrigger value="all">{t("workplans.title")}</TabsTrigger>
        </TabsList>

        {/* ===================== TODAY'S CHECKLIST ===================== */}
        <TabsContent value="today" className="space-y-4">
          {todayPlans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-medium text-foreground">
                  {t("workplans.todayEmpty")}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("workplans.todayEmptyDesc")}
                </p>
              </CardContent>
            </Card>
          ) : (
            todayPlans.map((plan) => (
              <Card key={plan.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{plan.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {plan.description}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="border-primary/30 text-primary">
                      {plan.progress}%
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {plan.assignee?.name || t("workplans.notAssigned")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(plan.startDate)} — {formatDate(plan.endDate)}
                    </span>
                    <span>
                      {t("workplans.completedItems", {
                        completed: plan.completedItems,
                        total: plan.totalItems,
                      })}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {plan.items.map((item) => (
                    <ChecklistItemRow
                      key={item.id}
                      item={item}
                      onToggle={() =>
                        handleToggleComplete(plan.id, item.id, item.completed)
                      }
                      onSaveDriveLink={(link) =>
                        handleSaveDriveLink(item.id, link, item.completed)
                      }
                      canEdit={true}
                      t={t}
                      formatDateTime={formatDateTime}
                      lang={lang}
                    />
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ===================== ALL WORK PLANS ===================== */}
        <TabsContent value="all" className="space-y-4">
          {allPlans.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="font-medium text-foreground">
                  {t("workplans.noPlans")}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t("workplans.noPlansDesc")}
                </p>
                {isTL && (
                  <Button
                    className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => setCreateOpen(true)}
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    {t("workplans.new")}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            allPlans.map((plan) => (
              <Card key={plan.id}>
                <CardContent className="pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className="border-primary/30 text-primary bg-primary/5"
                        >
                          {t("workplans.active")}
                        </Badge>
                        <Badge variant="outline" className="border-border">
                          {t("workplans.itemsCount", {
                            count: plan.totalItems,
                          })}
                        </Badge>
                      </div>
                      <h3 className="font-semibold mb-1">{plan.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {plan.description}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {plan.assignee?.name || t("workplans.notAssigned")}
                        </span>
                        <span>
                          {t("workplans.from")}: {formatDate(plan.startDate)}
                        </span>
                        <span>
                          {t("workplans.to")}: {formatDate(plan.endDate)}
                        </span>
                      </div>

                      {/* Items preview */}
                      <div className="mt-3 space-y-1">
                        {plan.items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 text-xs text-muted-foreground"
                          >
                            {item.completed ? (
                              <CheckCircle2 className="w-3 h-3 text-primary" />
                            ) : (
                              <Circle className="w-3 h-3" />
                            )}
                            <span>{item.title}</span>
                          </div>
                        ))}
                        {plan.items.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{plan.items.length - 3} {lang === "ar" ? "المزيد" : "more"}
                          </p>
                        )}
                      </div>
                    </div>

                    {isTL && (
                      <div className="flex flex-col gap-2 sm:items-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewProgress(plan, today)}
                          className="border-border"
                        >
                          <TrendingUp className="w-3.5 h-3.5 ml-1" />
                          {t("workplans.viewProgress")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(plan.id)}
                          className="border-destructive/30 text-destructive hover:bg-destructive/5"
                        >
                          <Trash2 className="w-3.5 h-3.5 ml-1" />
                          {t("workplans.delete")}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* ===================== CREATE WORK PLAN DIALOG ===================== */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("workplans.createTitle")}</DialogTitle>
            <DialogDescription>{t("workplans.createDesc")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wp-title">
                {t("workplans.title.label")} *
              </Label>
              <Input
                id="wp-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("workplans.title.placeholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wp-desc">
                {t("workplans.description.label")} *
              </Label>
              <Textarea
                id="wp-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("workplans.description.placeholder")}
                rows={3}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="wp-start">
                  {t("workplans.startDate.label")} *
                </Label>
                <Input
                  id="wp-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wp-end">
                  {t("workplans.endDate.label")} *
                </Label>
                <Input
                  id="wp-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="wp-assignee">
                {t("workplans.assignee.label")}
              </Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("workplans.assignee.placeholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {team.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Checklist items */}
            <div className="space-y-3">
              <div>
                <Label>{t("workplans.items.label")}</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("workplans.items.desc")}
                </p>
              </div>
              {items.map((item, index) => (
                <div
                  key={index}
                  className="p-3 rounded-md border border-border space-y-2"
                >
                  <div className="flex items-start gap-2">
                    <Input
                      value={item.title}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[index].title = e.target.value;
                        setItems(newItems);
                      }}
                      placeholder={t("workplans.item.title.placeholder")}
                      className="flex-1"
                    />
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/5 flex-shrink-0"
                        onClick={() => {
                          setItems(items.filter((_, i) => i !== index));
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <Input
                    value={item.description}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[index].description = e.target.value;
                      setItems(newItems);
                    }}
                    placeholder={t("workplans.item.description.placeholder")}
                    className="text-sm"
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setItems([...items, { title: "", description: "" }])
                }
                className="border-border"
              >
                <Plus className="w-4 h-4 ml-2" />
                {t("workplans.addItem")}
              </Button>
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
              >
                {t("workplans.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===================== PROGRESS VIEW DIALOG ===================== */}
      <Dialog
        open={!!progressView}
        onOpenChange={(o) => !o && setProgressView(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {progressView?.plan &&
                t("workplans.progressFor", {
                  name: progressView.plan.assignee?.name || "—",
                })}
            </DialogTitle>
            <DialogDescription>
              {progressView?.plan?.title} — {progressView?.date}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {progressView?.items.map((item: any) => (
              <ChecklistItemRow
                key={item.id}
                item={item}
                onToggle={() => {}}
                onSaveDriveLink={() => {}}
                canEdit={false}
                t={t}
                formatDateTime={formatDateTime}
                lang={lang}
              />
            ))}
            {progressView?.items.length === 0 && (
              <p className="text-center text-muted-foreground py-6">
                {t("workplans.noCompletions")}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// Checklist Item Row Component
// ============================================================

function ChecklistItemRow({
  item,
  onToggle,
  onSaveDriveLink,
  canEdit,
  t,
  formatDateTime,
  lang,
}: {
  item: WorkPlanItem;
  onToggle: () => void;
  onSaveDriveLink: (link: string) => void;
  canEdit: boolean;
  t: (key: string, vars?: any) => string;
  formatDateTime: (date: string | Date) => string;
  lang: string;
}) {
  const [editingLink, setEditingLink] = useState(false);
  const [linkValue, setLinkValue] = useState(item.driveLink || "");

  // Update linkValue when item.driveLink changes (e.g., after save+reload)
  const driveLinkKey = item.driveLink || "";
  const [lastDriveLink, setLastDriveLink] = useState(driveLinkKey);
  if (driveLinkKey !== lastDriveLink) {
    setLastDriveLink(driveLinkKey);
    setLinkValue(item.driveLink || "");
  }

  return (
    <div
      className={`p-3 rounded-md border ${
        item.completed
          ? "border-primary/30 bg-primary/5"
          : "border-border"
      }`}
    >
      <div className="flex items-start gap-3">
        {canEdit ? (
          <button
            onClick={onToggle}
            className="mt-0.5 flex-shrink-0"
            aria-label="Toggle complete"
          >
            {item.completed ? (
              <CheckCircle2 className="w-5 h-5 text-primary" />
            ) : (
              <Circle className="w-5 h-5 text-muted-foreground hover:text-primary" />
            )}
          </button>
        ) : item.completed ? (
          <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p
              className={`font-medium text-sm ${
                item.completed ? "line-through text-muted-foreground" : ""
              }`}
            >
              {item.title}
            </p>
            {item.completed && item.completedAt && (
              <span className="text-xs text-muted-foreground flex-shrink-0">
                {formatDateTime(item.completedAt)}
              </span>
            )}
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-1">
              {item.description}
            </p>
          )}

          {/* Drive link section */}
          {item.completed ? (
            <div className="mt-2">
              {item.driveLink && !editingLink ? (
                <a
                  href={item.driveLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                  dir="ltr"
                >
                  <Folder className="w-3 h-3" />
                  {t("workplans.driveLink.view")}
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : null}
              {canEdit && (
                <div className="mt-1">
                  {editingLink ? (
                    <div className="flex gap-2">
                      <Input
                        type="url"
                        dir="ltr"
                        value={linkValue}
                        onChange={(e) => setLinkValue(e.target.value)}
                        placeholder={t("workplans.driveLink.placeholder")}
                        className="text-sm h-8"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 flex-shrink-0"
                        onClick={() => {
                          onSaveDriveLink(linkValue);
                          setEditingLink(false);
                        }}
                      >
                        {t("workplans.driveLink.save")}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => setEditingLink(true)}
                    >
                      <Folder className="w-3 h-3 ml-1" />
                      {item.driveLink
                        ? t("workplans.driveLink.save")
                        : t("workplans.driveLink.label")}
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : canEdit ? (
            <p className="text-xs text-muted-foreground mt-1">
              {t("workplans.driveLink.hint")}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
