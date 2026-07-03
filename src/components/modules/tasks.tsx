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
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  CheckSquare,
  Plus,
  Clock,
  AlertCircle,
  Check,
  Repeat,
  CalendarDays,
  XCircle,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";
import {
  PRIORITY_COLORS,
  STATUS_COLORS,
  RECURRENCE_PATTERN_LABELS,
  formatArabicDateTime,
  formatEnglishDateTime,
  formatArabicDate,
  formatEnglishDate,
} from "@/lib/auth-labels";
import type { User } from "@/app/page";

interface Props {
  user: User;
}

export function TasksModule({ user }: Props) {
  const { t, lang } = useLanguage();
  const [tasks, setTasks] = useState<any[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");
  const [activeTab, setActiveTab] = useState("tasks");
  const [createOpen, setCreateOpen] = useState(false);
  const [createRecurringOpen, setCreateRecurringOpen] = useState(false);
  const isTL = user.role === "TEAM_LEADER";

  // One-time task form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("");

  // Recurring task form
  const [rTitle, setRTitle] = useState("");
  const [rDescription, setRDescription] = useState("");
  const [rPriority, setRPriority] = useState("MEDIUM");
  const [rPattern, setRPattern] = useState("DAILY");
  const [rStartDate, setRStartDate] = useState("");
  const [rEndDate, setREndDate] = useState("");
  const [rAssigneeId, setRAssigneeId] = useState("");

  const priorityLabels: Record<string, string> = {
    LOW: t("tasks.priority.low"),
    MEDIUM: t("tasks.priority.medium"),
    HIGH: t("tasks.priority.high"),
    URGENT: t("tasks.priority.urgent"),
  };
  const statusLabels: Record<string, string> = {
    OPEN: t("tasks.status.open"),
    IN_PROGRESS: t("tasks.status.in_progress"),
    COMPLETED: t("tasks.status.completed"),
    CANCELLED: t("tasks.status.cancelled"),
  };
  const patternLabels: Record<string, string> = {
    DAILY: t("tasks.pattern.daily"),
    WEEKLY: t("tasks.pattern.weekly"),
    MONTHLY: t("tasks.pattern.monthly"),
    WEEKDAYS: t("tasks.pattern.weekdays"),
  };

  useEffect(() => {
    loadTasks();
    loadRecurringTasks();
    if (isTL) loadTeam();
  }, [filter, activeTab]);

  const loadTasks = async () => {
    try {
      const res = await fetch(`/api/tasks?status=${filter}`);
      const data = await res.json();
      setTasks(data.tasks || []);
    } finally {
      setLoading(false);
    }
  };

  const loadRecurringTasks = async () => {
    try {
      const res = await fetch("/api/recurring-tasks");
      const data = await res.json();
      setRecurringTasks(data.recurringTasks || []);
    } catch {
      // ignore
    }
  };

  const loadTeam = async () => {
    const res = await fetch("/api/team");
    const data = await res.json();
    setTeam(data.members || []);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDeadline("");
    setPriority("MEDIUM");
    setAssigneeId("");
  };

  const resetRecurringForm = () => {
    setRTitle("");
    setRDescription("");
    setRPriority("MEDIUM");
    setRPattern("DAILY");
    setRStartDate("");
    setREndDate("");
    setRAssigneeId("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !deadline) {
      toast.error(t("tasks.fillRequired"));
      return;
    }
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          deadline: new Date(deadline).toISOString(),
          priority,
          assigneeId: assigneeId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success(t("tasks.created"));
      setCreateOpen(false);
      resetForm();
      loadTasks();
    } catch {
      toast.error(t("tasks.createFailed"));
    }
  };

  const handleCreateRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rTitle || !rDescription || !rStartDate || !rEndDate || !rPattern) {
      toast.error(t("tasks.recurringFillRequired"));
      return;
    }
    try {
      const res = await fetch("/api/recurring-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: rTitle,
          description: rDescription,
          priority: rPriority,
          pattern: rPattern,
          startDate: new Date(rStartDate).toISOString(),
          endDate: new Date(rEndDate).toISOString(),
          assigneeId: rAssigneeId || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success(
        t("tasks.recurringInstancesCreated", { count: data.instancesCreated })
      );
      setCreateRecurringOpen(false);
      resetRecurringForm();
      loadRecurringTasks();
      loadTasks();
    } catch {
      toast.error(t("tasks.recurringCreateFailed"));
    }
  };

  const handleComplete = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success(
        data.early
          ? t("tasks.completedEarly", { points: data.points })
          : t("tasks.completedMsg", { points: data.points })
      );
      loadTasks();
    } catch {
      toast.error(t("tasks.completeFailed"));
    }
  };

  const handleAssign = async (taskId: string, newAssigneeId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "assign", assigneeId: newAssigneeId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success(t("tasks.reassigned"));
      loadTasks();
    } catch {
      toast.error(t("tasks.reassignFailed"));
    }
  };

  const handleStopRecurring = async (id: string) => {
    if (!confirm(t("tasks.recurringStopConfirm"))) return;
    try {
      const res = await fetch(`/api/recurring-tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deactivate" }),
      });
      if (!res.ok) {
        toast.error("Failed");
        return;
      }
      toast.success(t("tasks.recurringStopped"));
      loadRecurringTasks();
    } catch {
      toast.error("Failed");
    }
  };

  const handleDeleteRecurring = async (id: string) => {
    if (!confirm(t("tasks.recurringDeleteConfirm"))) return;
    try {
      const res = await fetch(`/api/recurring-tasks/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        toast.error("Failed");
        return;
      }
      toast.success(t("tasks.recurringDeleted"));
      loadRecurringTasks();
      loadTasks();
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

  const now = new Date();
  const formatDateTime =
    lang === "ar" ? formatArabicDateTime : formatEnglishDateTime;
  const formatDate = lang === "ar" ? formatArabicDate : formatEnglishDate;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            {t("tasks.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isTL
              ? t("tasks.subtitle.leader")
              : t("tasks.subtitle.member")}
          </p>
        </div>

        {isTL && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCreateRecurringOpen(true)}
              className="border-border"
            >
              <Repeat className="w-4 h-4 ml-2" />
              {t("tasks.newRecurring")}
            </Button>
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 ml-2" />
              {t("tasks.new")}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs: Tasks vs Recurring */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="tasks">{t("tasks.title")}</TabsTrigger>
          <TabsTrigger value="recurring">
            {t("tasks.recurringTab")}
          </TabsTrigger>
        </TabsList>

        {/* ===================== TASKS TAB ===================== */}
        <TabsContent value="tasks" className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">{t("tasks.open")}</SelectItem>
                <SelectItem value="completed">
                  {t("tasks.completed")}
                </SelectItem>
                <SelectItem value="all">{t("tasks.all")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {filter === "open"
                    ? t("tasks.noOpenTasks")
                    : filter === "completed"
                    ? t("tasks.noCompletedTasks")
                    : t("tasks.noTasks")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const isOverdue =
                  task.status === "OPEN" && new Date(task.deadline) < now;
                const isAssignee = task.assigneeId === user.id;
                const isRecurring = !!task.recurringTaskId;

                return (
                  <Card
                    key={task.id}
                    className={
                      isOverdue
                        ? "border-destructive/40"
                        : task.status === "COMPLETED"
                        ? "opacity-70"
                        : ""
                    }
                  >
                    <CardContent className="pt-4">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {isOverdue && (
                              <Badge
                                variant="outline"
                                className="border-destructive/40 text-destructive bg-destructive/5"
                              >
                                <AlertCircle className="w-3 h-3 ml-1" />
                                {t("tasks.overdue")}
                              </Badge>
                            )}
                            {isRecurring && (
                              <Badge
                                variant="outline"
                                className="border-primary/30 text-primary bg-primary/5"
                              >
                                <Repeat className="w-3 h-3 ml-1" />
                                {t("tasks.recurringBadge")}
                              </Badge>
                            )}
                            <Badge
                              variant="outline"
                              className={PRIORITY_COLORS[task.priority]}
                            >
                              {priorityLabels[task.priority]}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={STATUS_COLORS[task.status]}
                            >
                              {statusLabels[task.status]}
                            </Badge>
                          </div>
                          <h3 className="font-semibold mb-1">{task.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2 whitespace-pre-line">
                            {task.description}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDateTime(task.deadline)}
                            </span>
                            {task.assignee && (
                              <span>
                                {t("tasks.assignee")}:{" "}
                                <strong>{task.assignee.name}</strong>
                              </span>
                            )}
                            {task.creator && (
                              <span>
                                {t("tasks.createdBy")}: {task.creator.name}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 sm:items-end">
                          {task.status === "OPEN" &&
                            (isAssignee || isTL) && (
                              <Button
                                size="sm"
                                onClick={() => handleComplete(task.id)}
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                              >
                                <Check className="w-3.5 h-3.5 ml-1" />
                                {t("tasks.complete")}
                              </Button>
                            )}
                          {isTL && task.status === "OPEN" && (
                            <Select
                              value={task.assigneeId || ""}
                              onValueChange={(v) => handleAssign(task.id, v)}
                            >
                              <SelectTrigger className="w-40 h-8 text-xs">
                                <SelectValue
                                  placeholder={t("tasks.reassign")}
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
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ===================== RECURRING TAB ===================== */}
        <TabsContent value="recurring" className="space-y-4">
          {recurringTasks.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Repeat className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">
                  {t("tasks.recurringNoActive")}
                </p>
                {isTL && (
                  <Button
                    className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={() => setCreateRecurringOpen(true)}
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    {t("tasks.newRecurring")}
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {recurringTasks.map((rt) => (
                <Card key={rt.id}>
                  <CardContent className="pt-4">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className="border-primary/30 text-primary bg-primary/5"
                          >
                            <Repeat className="w-3 h-3 ml-1" />
                            {patternLabels[rt.pattern]}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={PRIORITY_COLORS[rt.priority]}
                          >
                            {priorityLabels[rt.priority]}
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-border text-muted-foreground"
                          >
                            <CalendarDays className="w-3 h-3 ml-1" />
                            {rt._count?.tasks || 0} {t("tasks.recurringInstances")}
                          </Badge>
                        </div>
                        <h3 className="font-semibold mb-1">{rt.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2 whitespace-pre-line">
                          {rt.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span>
                            {t("tasks.recurringActiveFrom")}:{" "}
                            {formatDate(rt.startDate)}
                          </span>
                          <span>
                            {t("tasks.recurringActiveTo")}:{" "}
                            {formatDate(rt.endDate)}
                          </span>
                          {rt.assignee && (
                            <span>
                              {t("tasks.assignee")}:{" "}
                              <strong>{rt.assignee.name}</strong>
                            </span>
                          )}
                        </div>
                      </div>

                      {isTL && (
                        <div className="flex flex-col gap-2 sm:items-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStopRecurring(rt.id)}
                            className="border-border"
                          >
                            <XCircle className="w-3.5 h-3.5 ml-1" />
                            {t("tasks.recurringStop")}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteRecurring(rt.id)}
                            className="border-destructive/30 text-destructive hover:bg-destructive/5"
                          >
                            {t("tasks.recurringDeleteAll")}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ===================== CREATE ONE-TIME TASK DIALOG ===================== */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("tasks.createTitle")}</DialogTitle>
            <DialogDescription>{t("tasks.createDesc")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t("tasks.title.label")} *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("tasks.title.placeholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">
                {t("tasks.description.label")} *
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("tasks.description.placeholder")}
                rows={4}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="deadline">
                  {t("tasks.deadline.label")} *
                </Label>
                <Input
                  id="deadline"
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="priority">
                  {t("tasks.priority.label")}
                </Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">
                      {t("tasks.priority.low")}
                    </SelectItem>
                    <SelectItem value="MEDIUM">
                      {t("tasks.priority.medium")}
                    </SelectItem>
                    <SelectItem value="HIGH">
                      {t("tasks.priority.high")}
                    </SelectItem>
                    <SelectItem value="URGENT">
                      {t("tasks.priority.urgent")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignee">{t("tasks.assignee.label")}</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("tasks.assignee.placeholder")}
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
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
                {t("tasks.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===================== CREATE RECURRING TASK DIALOG ===================== */}
      <Dialog open={createRecurringOpen} onOpenChange={setCreateRecurringOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Repeat className="w-5 h-5 text-primary" />
              {t("tasks.recurringTitle")}
            </DialogTitle>
            <DialogDescription>{t("tasks.recurringDesc")}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRecurring} className="space-y-4">
            {/* Info banner */}
            <div className="p-3 rounded-md bg-primary/5 border border-primary/20 flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-foreground/80">
                {t("tasks.recurringDesc")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rTitle">{t("tasks.title.label")} *</Label>
              <Input
                id="rTitle"
                value={rTitle}
                onChange={(e) => setRTitle(e.target.value)}
                placeholder={t("tasks.title.placeholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rDescription">
                {t("tasks.description.label")} *
              </Label>
              <Textarea
                id="rDescription"
                value={rDescription}
                onChange={(e) => setRDescription(e.target.value)}
                placeholder={t("tasks.description.placeholder")}
                rows={3}
                required
              />
            </div>

            {/* Pattern + Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="rPattern">
                  {t("tasks.pattern.label")} *
                </Label>
                <Select value={rPattern} onValueChange={setRPattern}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">
                      {t("tasks.pattern.daily")}
                    </SelectItem>
                    <SelectItem value="WEEKDAYS">
                      {t("tasks.pattern.weekdays")}
                    </SelectItem>
                    <SelectItem value="WEEKLY">
                      {t("tasks.pattern.weekly")}
                    </SelectItem>
                    <SelectItem value="MONTHLY">
                      {t("tasks.pattern.monthly")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rPriority">
                  {t("tasks.priority.label")}
                </Label>
                <Select value={rPriority} onValueChange={setRPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">
                      {t("tasks.priority.low")}
                    </SelectItem>
                    <SelectItem value="MEDIUM">
                      {t("tasks.priority.medium")}
                    </SelectItem>
                    <SelectItem value="HIGH">
                      {t("tasks.priority.high")}
                    </SelectItem>
                    <SelectItem value="URGENT">
                      {t("tasks.priority.urgent")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Start + End dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="rStartDate">
                  {t("tasks.startDate.label")} *
                </Label>
                <Input
                  id="rStartDate"
                  type="date"
                  value={rStartDate}
                  onChange={(e) => setRStartDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rEndDate">
                  {t("tasks.endDate.label")} *
                </Label>
                <Input
                  id="rEndDate"
                  type="date"
                  value={rEndDate}
                  onChange={(e) => setREndDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rAssignee">
                {t("tasks.assignee.label")}
              </Label>
              <Select value={rAssigneeId} onValueChange={setRAssigneeId}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("tasks.assignee.placeholder")}
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateRecurringOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Repeat className="w-4 h-4 ml-2" />
                {t("tasks.recurringCreate")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
