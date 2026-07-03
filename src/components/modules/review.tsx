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

interface ReportLink {
  type: "report";
  id: string;
  workerName: string;
  workerTitle: string | null;
  department: string;
  driveLink: string;
  completed: string;
  inProgress: string;
  submittedAt: string;
}

interface WorkPlanLink {
  type: "workplan";
  id: string;
  workerName: string;
  workerTitle: string | null;
  department: string;
  driveLink: string;
  taskTitle: string;
  taskDescription: string | null;
  workPlanTitle: string;
  completedAt: string | null;
}

interface ReviewData {
  date: string;
  reportLinks: ReportLink[];
  workPlanLinks: WorkPlanLink[];
  taskLinks: WorkPlanLink[];
  summary: {
    totalWorkers: number;
    workersSubmittedLinks: number;
    workersNotSubmitted: number;
    totalReportLinks: number;
    totalWorkPlanLinks: number;
    totalTaskLinks: number;
    totalLinks: number;
  };
}

export function ReviewModule({ user }: Props) {
  const { t, lang } = useLanguage();
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReview();
  }, []);

  const loadReview = async () => {
    try {
      const res = await fetch("/api/review/today");
      if (!res.ok) {
        setData(null);
        return;
      }
      const d = await res.json();
      setData(d);
    } finally {
      setLoading(false);
    }
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

  const totalLinks = data.summary.totalLinks;
  const hasAnyLinks = totalLinks > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">
          {t("review.title")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("review.subtitle")} — {formatDate(new Date())}
        </p>
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
              {data.summary.workersSubmittedLinks}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("review.workersSubmitted")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <Clock className="w-5 h-5 text-muted-foreground mb-3" />
            <p className="text-2xl font-bold">
              {data.summary.workersNotSubmitted}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("review.workersNotSubmitted")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5">
            <Link2 className="w-5 h-5 text-primary mb-3" />
            <p className="text-2xl font-bold">{totalLinks}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("review.totalLinks")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {!hasAnyLinks && (
        <Card>
          <CardContent className="py-12 text-center">
            <Folder className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-medium text-foreground">
              {t("review.noLinks")}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {t("review.noLinksDesc")}
            </p>
            {data.summary.workersNotSubmitted > 0 && (
              <div className="mt-4 p-3 rounded-md border border-border bg-muted/30 inline-block">
                <p className="text-xs text-muted-foreground">
                  {t("review.waitingDesc", {
                    count: data.summary.workersNotSubmitted,
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Report Links Section */}
      {data.reportLinks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              {t("review.reportLinks")}
              <Badge variant="outline" className="ml-2">
                {data.reportLinks.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              {lang === "ar"
                ? "روابط Drive المقدمة في التقارير اليومية"
                : "Drive links submitted in daily reports"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.reportLinks.map((link) => (
              <LinkCard
                key={link.id}
                workerName={link.workerName}
                workerTitle={link.workerTitle}
                department={link.department}
                driveLink={link.driveLink}
                time={link.submittedAt}
                taskLabel={lang === "ar" ? "تقرير يومي" : "Daily Report"}
                taskDescription={link.completed}
                t={t}
                formatTime={formatTime}
                deptLabels={deptLabels}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Work Plan Links Section */}
      {data.workPlanLinks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              {t("review.workPlanLinks")}
              <Badge variant="outline" className="ml-2">
                {data.workPlanLinks.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              {lang === "ar"
                ? "روابط Drive المقدمة في مهام خطط العمل"
                : "Drive links submitted for work plan tasks"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.workPlanLinks.map((link) => (
              <LinkCard
                key={link.id}
                workerName={link.workerName}
                workerTitle={link.workerTitle}
                department={link.department}
                driveLink={link.driveLink}
                time={link.completedAt || ""}
                taskLabel={link.taskTitle}
                taskDescription={link.taskDescription}
                workPlanTitle={link.workPlanTitle}
                t={t}
                formatTime={formatTime}
                deptLabels={deptLabels}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Task Links Section */}
      {data.taskLinks && data.taskLinks.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              {lang === "ar" ? "روابط المهام" : "Task Links"}
              <Badge variant="outline" className="ml-2">
                {data.taskLinks.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              {lang === "ar"
                ? "روابط Drive المقدمة في المهام"
                : "Drive links submitted for tasks"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.taskLinks.map((link) => (
              <LinkCard
                key={link.id}
                workerName={link.workerName}
                workerTitle={link.workerTitle}
                department={link.department}
                driveLink={link.driveLink}
                time={link.completedAt || ""}
                taskLabel={link.taskTitle}
                taskDescription={link.taskDescription}
                t={t}
                formatTime={formatTime}
                deptLabels={deptLabels}
              />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function LinkCard({
  workerName,
  workerTitle,
  department,
  driveLink,
  time,
  taskLabel,
  taskDescription,
  workPlanTitle,
  t,
  formatTime,
  deptLabels,
}: {
  workerName: string;
  workerTitle: string | null;
  department: string;
  driveLink: string;
  time: string;
  taskLabel: string;
  taskDescription: string | null;
  workPlanTitle?: string;
  t: (key: string, vars?: any) => string;
  formatTime: (date: string | Date) => string;
  deptLabels: Record<string, string>;
}) {
  const initials = workerName
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

  return (
    <div className="p-4 rounded-md border border-border hover:bg-muted/30">
      <div className="flex items-start gap-3">
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-muted text-foreground text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          {/* Worker info */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="font-semibold text-sm">{workerName}</p>
            {workerTitle && (
              <Badge variant="outline" className="text-xs">
                {workerTitle}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground">
              {deptLabels[department] || department}
            </span>
            {time && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(time)}
              </span>
            )}
          </div>

          {/* Task info */}
          <div className="mb-2">
            <p className="text-sm font-medium text-foreground">
              {taskLabel}
            </p>
            {workPlanTitle && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("review.workPlan")}: {workPlanTitle}
              </p>
            )}
            {taskDescription && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 whitespace-pre-line">
                {taskDescription}
              </p>
            )}
          </div>

          {/* Drive link */}
          <a
            href={driveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            dir="ltr"
          >
            <Folder className="w-4 h-4" />
            {t("review.viewWork")}
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
