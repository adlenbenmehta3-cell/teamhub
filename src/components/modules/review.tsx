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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ClipboardCheck,
  FileText,
  ClipboardList,
  CheckSquare,
  ExternalLink,
  Folder,
  Users,
  Link2,
  Clock,
  AlertCircle,
  CheckCircle2,
  Circle,
  Repeat,
  ChevronDown,
  Calendar,
  Briefcase,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import {
  formatArabicDate,
  formatEnglishDate,
  formatArabicTime,
  formatEnglishTime,
} from "@/lib/auth-labels";
import type { User } from "@/app/page";

interface Props {
  user: User;
}

interface WorkerTask {
  id: string;
  title: string;
  description: string;
  deadline: string;
  priority: string;
  status: string;
  completed: boolean;
  driveLink: string | null;
  completedAt: string | null;
  isRecurring: boolean;
  isOverdue: boolean;
}

interface WorkerWorkPlanItem {
  id: string;
  title: string;
  description: string | null;
  workPlanTitle: string;
  completed: boolean;
  driveLink: string | null;
  completedAt: string | null;
}

interface WorkerReport {
  id: string;
  completed: string;
  inProgress: string;
  blockers: string;
  tomorrow: string;
  driveLink: string | null;
  submittedAt: string;
}

interface WorkerData {
  id: string;
  name: string;
  title: string | null;
  department: string;
  tasks: WorkerTask[];
  workPlanItems: WorkerWorkPlanItem[];
  report: WorkerReport | null;
  summary: {
    totalTasks: number;
    completedTasks: number;
    uncompletedTasks: number;
    overdueTasks: number;
    totalWorkPlanItems: number;
    completedWorkPlanItems: number;
    hasReport: boolean;
    hasDriveLinks: boolean;
  };
}

interface ReviewData {
  date: string;
  workers: WorkerData[];
  summary: {
    totalWorkers: number;
    workersWithActivity: number;
    workersWithDriveLinks: number;
    totalTasks: number;
    totalCompletedTasks: number;
    totalOverdueTasks: number;
  };
}

export function ReviewModule({ user }: Props) {
  const { t, lang } = useLanguage();
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [expandedWorkers, setExpandedWorkers] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    loadReview();
  }, [selectedDate]);

  const loadReview = async () => {
    try {
      const res = await fetch(`/api/review/today?date=${selectedDate}`);
      if (!res.ok) {
        setData(null);
        return;
      }
      const d = await res.json();
      setData(d);
      // Auto-expand workers who have activity
      const activeWorkers = new Set(
        (d.workers || [])
          .filter(
            (w: WorkerData) =>
              w.summary.totalTasks > 0 ||
              w.summary.totalWorkPlanItems > 0 ||
              w.summary.hasReport
          )
          .map((w: WorkerData) => w.id)
      );
      setExpandedWorkers(activeWorkers);
    } finally {
      setLoading(false);
    }
  };

  const toggleWorker = (id: string) => {
    setExpandedWorkers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    if (!data) return;
    setExpandedWorkers(new Set(data.workers.map((w) => w.id)));
  };

  const collapseAll = () => {
    setExpandedWorkers(new Set());
  };

  const formatDate = lang === "ar" ? formatArabicDate : formatEnglishDate;
  const formatTime = lang === "ar" ? formatArabicTime : formatEnglishTime;

  const deptLabels: Record<string, string> = {
    SOCIAL_MEDIA: t("dept.social_media"),
    CONTENT_CREATION: t("dept.content_creation"),
    SEO_ANALYTICS: t("dept.seo_analytics"),
    PAID_ADS: t("dept.paid_ads"),
    EMAIL_MARKETING: t("dept.email_marketing"),
    GENERAL: t("dept.general"),
  };

  const priorityLabels: Record<string, string> = {
    LOW: t("tasks.priority.low"),
    MEDIUM: t("tasks.priority.medium"),
    HIGH: t("tasks.priority.high"),
    URGENT: t("tasks.priority.urgent"),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {lang === "ar"
              ? "غير مصرح لك بعرض هذه الصفحة"
              : "You are not authorized to view this page"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const activeWorkers = data.workers.filter(
    (w) =>
      w.summary.totalTasks > 0 ||
      w.summary.totalWorkPlanItems > 0 ||
      w.summary.hasReport
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
            {t("review.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("review.subtitle")} — {formatDate(new Date(selectedDate))}
          </p>
        </div>

        {/* Date picker */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setLoading(true);
              }}
              className="w-40 h-9"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-5">
            <Users className="w-5 h-5 text-primary mb-3" />
            <p className="text-2xl font-bold">{data.summary.totalWorkers}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("review.totalWorkers")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <ClipboardCheck className="w-5 h-5 text-primary mb-3" />
            <p className="text-2xl font-bold">
              {data.summary.totalCompletedTasks}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {lang === "ar" ? "مهام مكتملة" : "Completed Tasks"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <AlertCircle className="w-5 h-5 text-destructive mb-3" />
            <p className="text-2xl font-bold text-destructive">
              {data.summary.totalOverdueTasks}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {lang === "ar" ? "مهام متأخرة" : "Overdue Tasks"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <Link2 className="w-5 h-5 text-primary mb-3" />
            <p className="text-2xl font-bold">
              {data.summary.workersWithDriveLinks}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("review.workersSubmitted")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Expand/Collapse All */}
      {activeWorkers.length > 0 && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            <ChevronDown className="w-3.5 h-3.5 ml-1" />
            {lang === "ar" ? "توسيع الكل" : "Expand All"}
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            {lang === "ar" ? "طي الكل" : "Collapse All"}
          </Button>
        </div>
      )}

      {/* Worker Cards */}
      {activeWorkers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Folder className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-medium text-foreground">
              {t("review.noLinks")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {lang === "ar"
                ? "لا يوجد نشاط للعمال في هذا التاريخ."
                : "No worker activity on this date."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {activeWorkers.map((worker) => (
            <WorkerCard
              key={worker.id}
              worker={worker}
              isExpanded={expandedWorkers.has(worker.id)}
              onToggle={() => toggleWorker(worker.id)}
              t={t}
              lang={lang}
              formatDate={formatDate}
              formatTime={formatTime}
              deptLabels={deptLabels}
              priorityLabels={priorityLabels}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Worker Card Component
// ============================================================

function WorkerCard({
  worker,
  isExpanded,
  onToggle,
  t,
  lang,
  formatTime,
  deptLabels,
  priorityLabels,
}: {
  worker: WorkerData;
  isExpanded: boolean;
  onToggle: () => void;
  t: (key: string, vars?: any) => string;
  lang: string;
  formatDate: (date: string | Date) => string;
  formatTime: (date: string | Date) => string;
  deptLabels: Record<string, string>;
  priorityLabels: Record<string, string>;
}) {
  const initials = worker.name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

  const hasOverdue = worker.summary.overdueTasks > 0;
  const allCompleted =
    worker.summary.totalTasks > 0 &&
    worker.summary.uncompletedTasks === 0 &&
    (worker.summary.totalWorkPlanItems === 0 ||
      worker.summary.completedWorkPlanItems ===
        worker.summary.totalWorkPlanItems);

  return (
    <Card
      className={
        hasOverdue
          ? "border-destructive/30"
          : allCompleted
          ? "border-primary/30"
          : ""
      }
    >
      <Collapsible open={isExpanded} onOpenChange={() => {}}>
        {/* Worker Header (clickable) */}
        <CollapsibleTrigger asChild>
          <button
            onClick={onToggle}
            className="w-full text-left p-4 hover:bg-muted/30 transition-colors rounded-t-lg"
          >
            <div className="flex items-center gap-3">
              <Avatar className="w-11 h-11">
                <AvatarFallback className="bg-muted text-foreground font-semibold text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{worker.name}</p>
                  {worker.title && (
                    <Badge variant="outline" className="text-xs">
                      <Briefcase className="w-2.5 h-2.5 ml-1" />
                      {worker.title}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {deptLabels[worker.department] || worker.department}
                  </span>
                </div>

                {/* Progress indicators */}
                <div className="flex items-center gap-3 mt-1.5 text-xs flex-wrap">
                  {/* Tasks progress */}
                  {worker.summary.totalTasks > 0 && (
                    <span className="flex items-center gap-1">
                      <CheckSquare className="w-3 h-3" />
                      {worker.summary.completedTasks}/
                      {worker.summary.totalTasks}{" "}
                      {lang === "ar" ? "مهام" : "tasks"}
                    </span>
                  )}
                  {/* Overdue */}
                  {worker.summary.overdueTasks > 0 && (
                    <span className="flex items-center gap-1 text-destructive font-medium">
                      <AlertCircle className="w-3 h-3" />
                      {worker.summary.overdueTasks}{" "}
                      {lang === "ar" ? "متأخرة" : "overdue"}
                    </span>
                  )}
                  {/* Work plan progress */}
                  {worker.summary.totalWorkPlanItems > 0 && (
                    <span className="flex items-center gap-1">
                      <ClipboardList className="w-3 h-3" />
                      {worker.summary.completedWorkPlanItems}/
                      {worker.summary.totalWorkPlanItems}{" "}
                      {lang === "ar" ? "قائمة" : "checklist"}
                    </span>
                  )}
                  {/* Report */}
                  {worker.summary.hasReport ? (
                    <span className="flex items-center gap-1 text-primary">
                      <FileText className="w-3 h-3" />
                      {lang === "ar" ? "تقرير مُقدَّم" : "Report submitted"}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {lang === "ar" ? "لا تقرير" : "No report"}
                    </span>
                  )}
                </div>
              </div>

              {/* Status badge */}
              <div className="flex items-center gap-2">
                {allCompleted && (
                  <Badge
                    variant="outline"
                    className="bg-primary/10 text-primary border-primary/30"
                  >
                    <CheckCircle2 className="w-3 h-3 ml-1" />
                    {lang === "ar" ? "مكتمل" : "Done"}
                  </Badge>
                )}
                {hasOverdue && (
                  <Badge
                    variant="outline"
                    className="bg-destructive/10 text-destructive border-destructive/30"
                  >
                    <AlertCircle className="w-3 h-3 ml-1" />
                    {lang === "ar" ? "متأخر" : "Late"}
                  </Badge>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
              </div>
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Expanded Content */}
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 space-y-4">
            {/* Divider */}
            <div className="border-t border-border" />

            {/* Tasks Section */}
            {worker.tasks.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-primary" />
                  {lang === "ar" ? "المهام" : "Tasks"}
                  <Badge variant="outline" className="text-xs ml-1">
                    {worker.summary.completedTasks}/{worker.summary.totalTasks}
                  </Badge>
                </h4>
                <div className="space-y-2">
                  {worker.tasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      t={t}
                      lang={lang}
                      formatTime={formatTime}
                      priorityLabels={priorityLabels}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Work Plan Checklist Section */}
            {worker.workPlanItems.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  {lang === "ar" ? "قائمة المهام اليومية" : "Daily Checklist"}
                  <Badge variant="outline" className="text-xs ml-1">
                    {worker.summary.completedWorkPlanItems}/
                    {worker.summary.totalWorkPlanItems}
                  </Badge>
                </h4>
                <div className="space-y-2">
                  {worker.workPlanItems.map((item) => (
                    <ChecklistRow
                      key={item.id}
                      item={item}
                      t={t}
                      lang={lang}
                      formatTime={formatTime}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Daily Report Section */}
            {worker.report ? (
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-primary" />
                  {lang === "ar" ? "التقرير اليومي" : "Daily Report"}
                </h4>
                <div className="p-3 rounded-md border border-border bg-muted/20 space-y-2 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-0.5">
                      {lang === "ar" ? "ما تم إنجازه:" : "Completed:"}
                    </p>
                    <p className="text-foreground whitespace-pre-line">
                      {worker.report.completed}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-0.5">
                      {lang === "ar" ? "قيد التقدم:" : "In Progress:"}
                    </p>
                    <p className="text-foreground whitespace-pre-line">
                      {worker.report.inProgress}
                    </p>
                  </div>
                  {worker.report.blockers &&
                    worker.report.blockers !== "لا يوجد" &&
                    worker.report.blockers !== "None" && (
                      <div>
                        <p className="text-xs font-semibold text-destructive mb-0.5">
                          {lang === "ar" ? "العوائق:" : "Blockers:"}
                        </p>
                        <p className="text-foreground">
                          {worker.report.blockers}
                        </p>
                      </div>
                    )}
                  {worker.report.driveLink && (
                    <a
                      href={worker.report.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      dir="ltr"
                    >
                      <Folder className="w-3 h-3" />
                      {t("review.viewWork")}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ) : (
              worker.summary.totalTasks === 0 &&
              worker.summary.totalWorkPlanItems === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {lang === "ar"
                    ? "لا يوجد نشاط لهذا العامل في هذا التاريخ."
                    : "No activity for this worker on this date."}
                </p>
              )
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// ============================================================
// Task Row Component
// ============================================================

function TaskRow({
  task,
  t,
  lang,
  formatTime,
  priorityLabels,
}: {
  task: WorkerTask;
  t: (key: string, vars?: any) => string;
  lang: string;
  formatTime: (date: string | Date) => string;
  priorityLabels: Record<string, string>;
}) {
  return (
    <div
      className={`p-3 rounded-md border ${
        task.completed
          ? "border-primary/20 bg-primary/5"
          : task.isOverdue
          ? "border-destructive/30 bg-destructive/5"
          : "border-border"
      }`}
    >
      <div className="flex items-start gap-2">
        {task.completed ? (
          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        ) : (
          <Circle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p
              className={`text-sm font-medium ${
                task.completed ? "line-through text-muted-foreground" : ""
              }`}
            >
              {task.title}
            </p>
            {task.isRecurring && (
              <Badge variant="outline" className="text-xs py-0">
                <Repeat className="w-2.5 h-2.5 ml-1" />
                {t("tasks.recurringBadge")}
              </Badge>
            )}
            {task.isOverdue && !task.completed && (
              <Badge
                variant="outline"
                className="text-xs py-0 border-destructive/30 text-destructive bg-destructive/5"
              >
                <AlertCircle className="w-2.5 h-2.5 ml-1" />
                {t("tasks.overdue")}
              </Badge>
            )}
            <Badge variant="outline" className="text-xs py-0">
              {priorityLabels[task.priority]}
            </Badge>
          </div>

          {task.description && (
            <p className="text-xs text-muted-foreground line-clamp-1 mb-1">
              {task.description}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {task.deadline.substring(0, 10)}
            </span>
            {task.completedAt && (
              <span>
                {lang === "ar" ? "أُنجزت:" : "Done:"}{" "}
                {formatTime(task.completedAt)}
              </span>
            )}
          </div>

          {task.driveLink && (
            <a
              href={task.driveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
              dir="ltr"
            >
              <Folder className="w-3 h-3" />
              {t("review.viewWork")}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Checklist Row Component
// ============================================================

function ChecklistRow({
  item,
  t,
  lang,
  formatTime,
}: {
  item: WorkerWorkPlanItem;
  t: (key: string, vars?: any) => string;
  lang: string;
  formatTime: (date: string | Date) => string;
}) {
  return (
    <div
      className={`p-3 rounded-md border ${
        item.completed
          ? "border-primary/20 bg-primary/5"
          : "border-border"
      }`}
    >
      <div className="flex items-start gap-2">
        {item.completed ? (
          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
        ) : (
          <Circle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <p
            className={`text-sm font-medium ${
              item.completed ? "line-through text-muted-foreground" : ""
            }`}
          >
            {item.title}
          </p>
          {item.description && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {item.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">
            {item.workPlanTitle}
            {item.completedAt && ` • ${formatTime(item.completedAt)}`}
          </p>

          {item.driveLink && (
            <a
              href={item.driveLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
              dir="ltr"
            >
              <Folder className="w-3 h-3" />
              {t("review.viewWork")}
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
