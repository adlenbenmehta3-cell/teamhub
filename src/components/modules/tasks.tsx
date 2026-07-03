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
import { CheckSquare, Plus, Clock, AlertCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";
import {
  PRIORITY_COLORS,
  STATUS_COLORS,
  formatArabicDateTime,
  formatEnglishDateTime,
} from "@/lib/auth-labels";
import type { User } from "@/app/page";

interface Props {
  user: User;
}

export function TasksModule({ user }: Props) {
  const { t, lang } = useLanguage();
  const [tasks, setTasks] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("open");
  const [createOpen, setCreateOpen] = useState(false);
  const isTL = user.role === "TEAM_LEADER";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("");

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

  useEffect(() => {
    loadTasks();
    if (isTL) loadTeam();
  }, [filter]);

  const loadTasks = async () => {
    try {
      const res = await fetch(`/api/tasks?status=${filter}`);
      const data = await res.json();
      setTasks(data.tasks || []);
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
      setTitle("");
      setDescription("");
      setDeadline("");
      setPriority("MEDIUM");
      setAssigneeId("");
      loadTasks();
    } catch {
      toast.error(t("tasks.createFailed"));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
      </div>
    );
  }

  const now = new Date();
  const formatDateTime =
    lang === "ar" ? formatArabicDateTime : formatEnglishDateTime;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-emerald-900">
            {t("tasks.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isTL ? t("tasks.subtitle.leader") : t("tasks.subtitle.member")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="open">{t("tasks.open")}</SelectItem>
              <SelectItem value="completed">{t("tasks.completed")}</SelectItem>
              <SelectItem value="all">{t("tasks.all")}</SelectItem>
            </SelectContent>
          </Select>

          {isTL && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                  <Plus className="w-4 h-4 ml-2" />
                  {t("tasks.new")}
                </Button>
              </DialogTrigger>
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
                      <Label htmlFor="priority">{t("tasks.priority.label")}</Label>
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
                        <SelectValue placeholder={t("tasks.assignee.placeholder")} />
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
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-emerald-600 to-teal-600"
                    >
                      {t("tasks.create")}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
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

            return (
              <Card
                key={task.id}
                className={
                  isOverdue
                    ? "border-red-200"
                    : task.status === "COMPLETED"
                    ? "border-emerald-100 opacity-75"
                    : "border-emerald-100"
                }
              >
                <CardContent className="pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {isOverdue && (
                          <Badge
                            variant="outline"
                            className="border-red-300 text-red-700 bg-red-50"
                          >
                            <AlertCircle className="w-3 h-3 ml-1" />
                            {t("tasks.overdue")}
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
                      <h3 className="font-semibold text-emerald-900 mb-1">
                        {task.title}
                      </h3>
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
                      {task.status === "OPEN" && (isAssignee || isTL) && (
                        <Button
                          size="sm"
                          onClick={() => handleComplete(task.id)}
                          className="bg-emerald-600 hover:bg-emerald-700"
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
                            <SelectValue placeholder={t("tasks.reassign")} />
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
    </div>
  );
}
