"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Clock,
  CheckSquare,
  FileText,
  Calendar,
  Trophy,
  AlertCircle,
  TrendingUp,
  Megaphone,
  ArrowLeft,
  ArrowRight,
  Pin,
} from "lucide-react";
import { useLanguage } from "@/components/language-provider";
import {
  ROLE_LABELS,
  DEPARTMENT_LABELS,
  formatArabicDateTime,
  formatEnglishDateTime,
  timeAgoArabic,
  timeAgoEnglish,
} from "@/lib/auth-labels";
import type { User } from "@/app/page";

interface Props {
  user: User;
  onNavigate: (tab: string) => void;
}

export function Dashboard({ user, onNavigate }: Props) {
  const { t, lang } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const d = await res.json();
      setData(d);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  const isTL = data.type === "team_leader";
  const stats = data.stats;
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t("greeting.morning")
      : hour < 18
      ? t("greeting.afternoon")
      : t("greeting.evening");

  const ArrowIcon = lang === "ar" ? ArrowLeft : ArrowRight;
  const roleLabels: Record<string, string> = {
    TEAM_LEADER: t("role.team_leader"),
    SENIOR_MARKETER: t("role.senior_marketer"),
    MARKETING_SPECIALIST: t("role.marketing_specialist"),
    JUNIOR_MARKETER: t("role.junior_marketer"),
    GUEST: t("role.guest"),
  };
  const deptLabels: Record<string, string> = {
    SOCIAL_MEDIA: t("dept.social_media"),
    CONTENT_CREATION: t("dept.content_creation"),
    SEO_ANALYTICS: t("dept.seo_analytics"),
    PAID_ADS: t("dept.paid_ads"),
    EMAIL_MARKETING: t("dept.email_marketing"),
    GENERAL: t("dept.general"),
  };
  const timeAgo = lang === "ar" ? timeAgoArabic : timeAgoEnglish;
  const formatDateTime =
    lang === "ar" ? formatArabicDateTime : formatEnglishDateTime;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-emerald-900">
          {greeting}, {user.name} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {isTL
            ? t("dashboard.title.teamLeader")
            : t("dashboard.title.member")}
        </p>
      </div>

      {/* Stats Grid */}
      {isTL ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t("dashboard.teamMembers")}
            value={stats.totalMembers}
            icon={Users}
            color="emerald"
            onClick={() => onNavigate("team")}
          />
          <StatCard
            title={t("dashboard.todayAttendance")}
            value={`${stats.todayAttendance}/${stats.totalMembers}`}
            subtitle={`${stats.todayLate} ${t("dashboard.late")}`}
            icon={Clock}
            color="teal"
            onClick={() => onNavigate("attendance")}
          />
          <StatCard
            title={t("dashboard.openTasks")}
            value={stats.openTasks}
            subtitle={`${stats.overdueTasks} ${t("dashboard.overdueTasks")}`}
            icon={CheckSquare}
            color="amber"
            onClick={() => onNavigate("tasks")}
          />
          <StatCard
            title={t("dashboard.todayReports")}
            value={`${stats.todayReports}/${stats.totalMembers}`}
            icon={FileText}
            color="blue"
            onClick={() => onNavigate("reports")}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={t("dashboard.attendanceStatus")}
            value={
              stats.checkedInToday
                ? t("dashboard.recorded")
                : t("dashboard.notRecorded")
            }
            subtitle={
              stats.isLate ? t("attendance.late") : t("attendance.onTime")
            }
            icon={Clock}
            color={stats.checkedInToday ? "emerald" : "amber"}
            onClick={() => onNavigate("attendance")}
          />
          <StatCard
            title={t("dashboard.myOpenTasks")}
            value={stats.myOpenTasks}
            subtitle={`${stats.myOverdueTasks} ${t("dashboard.overdueTasks")}`}
            icon={CheckSquare}
            color="teal"
            onClick={() => onNavigate("tasks")}
          />
          <StatCard
            title={t("dashboard.todayReport")}
            value={
              stats.myTodayReport
                ? t("dashboard.submitted")
                : t("dashboard.pending")
            }
            icon={FileText}
            color={stats.myTodayReport ? "emerald" : "amber"}
            onClick={() => onNavigate("reports")}
          />
          <StatCard
            title={t("dashboard.myUpcomingMeetings")}
            value={stats.myUpcomingMeetings}
            icon={Calendar}
            color="blue"
            onClick={() => onNavigate("meetings")}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Announcements */}
          {data.announcements && data.announcements.length > 0 && (
            <Card className="border-emerald-100">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-emerald-600" />
                    {t("dashboard.recentAnnouncements")}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-emerald-700"
                    onClick={() => onNavigate("announcements")}
                  >
                    {t("dashboard.viewAll")}
                    <ArrowIcon className="w-3.5 h-3.5 mr-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.announcements.slice(0, 3).map((a: any) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {a.pinned && <Pin className="w-3 h-3 text-emerald-600" />}
                      <h4 className="font-semibold text-sm text-emerald-900">
                        {a.title}
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1 whitespace-pre-line">
                      {a.content}
                    </p>
                    <p className="text-xs text-emerald-600">
                      {a.creator?.name} • {timeAgo(a.createdAt)}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Leaderboard (TL view) */}
          {isTL && data.leaderboard && data.leaderboard.length > 0 && (
            <Card className="border-amber-100">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    {t("dashboard.weeklyLeaderboard")}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-amber-700"
                    onClick={() => onNavigate("leaderboard")}
                  >
                    {t("dashboard.viewAll")}
                    <ArrowIcon className="w-3.5 h-3.5 mr-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.leaderboard.slice(0, 5).map((m: any, i: number) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-amber-50/50"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          i === 0
                            ? "bg-amber-100 text-amber-700"
                            : i === 1
                            ? "bg-slate-100 text-slate-700"
                            : i === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <Avatar className="w-9 h-9">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 text-xs">
                          {m.name
                            .split(" ")
                            .slice(0, 2)
                            .map((s: string) => s[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {deptLabels[m.department] || m.department}
                        </p>
                      </div>
                      <span className="font-bold text-amber-600 text-sm">
                        {m.weeklyPoints}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* My tasks (member view) */}
          {!isTL && data.myTasks && data.myTasks.length > 0 && (
            <Card className="border-emerald-100">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-emerald-600" />
                    {t("dashboard.myCurrentTasks")}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-emerald-700"
                    onClick={() => onNavigate("tasks")}
                  >
                    {t("dashboard.viewAll")}
                    <ArrowIcon className="w-3.5 h-3.5 mr-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.myTasks.slice(0, 5).map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-emerald-50/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("tasks.deadline")}: {formatDateTime(task.deadline)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`mr-2 text-xs ${
                        task.priority === "URGENT"
                          ? "border-red-200 text-red-700 bg-red-50"
                          : task.priority === "HIGH"
                          ? "border-amber-200 text-amber-700 bg-amber-50"
                          : "border-slate-200 text-slate-700"
                      }`}
                    >
                      {task.priority === "URGENT"
                        ? t("tasks.priority.urgent")
                        : task.priority === "HIGH"
                        ? t("tasks.priority.high")
                        : task.priority === "MEDIUM"
                        ? t("tasks.priority.medium")
                        : t("tasks.priority.low")}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recent activity (TL view) */}
          {isTL && data.recentActivity && data.recentActivity.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  {t("dashboard.recentActivity")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.recentActivity.slice(0, 8).map((a: any) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{a.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {a.reason}
                        </p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-emerald-600">
                        +{a.amount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {timeAgo(a.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Side column */}
        <div className="space-y-6">
          {/* Overdue Alert */}
          {isTL && stats.overdueTasks > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-red-900">
                      {t("dashboard.overdueAlert", {
                        count: stats.overdueTasks,
                      })}
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      {t("dashboard.overdueAlertDesc")}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 border-red-200 text-red-700 hover:bg-red-100"
                      onClick={() => onNavigate("tasks")}
                    >
                      {t("dashboard.reviewTasks")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* My points card */}
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <Trophy className="w-8 h-8" />
                <Badge className="bg-white/20 text-white border-0">
                  {roleLabels[user.role]}
                </Badge>
              </div>
              <p className="text-sm opacity-90">{t("dashboard.totalPoints")}</p>
              <p className="text-4xl font-bold mt-1">{user.totalPoints}</p>
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/20">
                <div>
                  <p className="text-xs opacity-75">
                    {t("dashboard.thisWeek")}
                  </p>
                  <p className="text-lg font-bold">{user.weeklyPoints}</p>
                </div>
                <div>
                  <p className="text-xs opacity-75">
                    {t("dashboard.thisMonth")}
                  </p>
                  <p className="text-lg font-bold">{user.monthlyPoints}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {t("dashboard.quickActions")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => onNavigate("attendance")}
              >
                <Clock className="w-4 h-4 ml-2" />
                {t("dashboard.checkIn")}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => onNavigate("reports")}
              >
                <FileText className="w-4 h-4 ml-2" />
                {t("dashboard.submitReport")}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => onNavigate("tasks")}
              >
                <CheckSquare className="w-4 h-4 ml-2" />
                {t("dashboard.viewMyTasks")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  onClick,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  color: string;
  onClick?: () => void;
}) {
  const colorMap: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    teal: "bg-teal-50 text-teal-700 border-teal-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    red: "bg-red-50 text-red-700 border-red-100",
  };

  return (
    <Card
      className={`${colorMap[color]} cursor-pointer hover:shadow-md transition-shadow`}
      onClick={onClick}
    >
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs opacity-80 mt-1">{title}</p>
        {subtitle && <p className="text-xs opacity-70 mt-0.5">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
