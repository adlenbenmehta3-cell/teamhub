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
  Pin,
} from "lucide-react";
import {
  ROLE_LABELS,
  DEPARTMENT_LABELS,
  formatArabicDateTime,
  timeAgoArabic,
} from "@/lib/auth-labels";
import type { User } from "@/app/page";

interface Props {
  user: User;
  onNavigate: (tab: string) => void;
}

export function Dashboard({ user, onNavigate }: Props) {
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
    hour < 12 ? "صباح الخير" : hour < 18 ? "مساء الخير" : "مساء الخير";

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-emerald-900">
          {greeting}، {user.name} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {isTL
            ? "نظرة عامة على حالة الفريق اليوم"
            : "نظرة عامة على نشاطك اليوم"}
        </p>
      </div>

      {/* Stats Grid */}
      {isTL ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="أعضاء الفريق"
            value={stats.totalMembers}
            icon={Users}
            color="emerald"
            onClick={() => onNavigate("team")}
          />
          <StatCard
            title="الحضور اليوم"
            value={`${stats.todayAttendance}/${stats.totalMembers}`}
            subtitle={`${stats.todayLate} متأخر`}
            icon={Clock}
            color="teal"
            onClick={() => onNavigate("attendance")}
          />
          <StatCard
            title="المهام المفتوحة"
            value={stats.openTasks}
            subtitle={`${stats.overdueTasks} متأخرة`}
            icon={CheckSquare}
            color="amber"
            onClick={() => onNavigate("tasks")}
          />
          <StatCard
            title="تقارير اليوم"
            value={`${stats.todayReports}/${stats.totalMembers}`}
            icon={FileText}
            color="blue"
            onClick={() => onNavigate("reports")}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="حالة الحضور"
            value={stats.checkedInToday ? "مسجّل" : "لم يُسجّل"}
            subtitle={stats.isLate ? "متأخر" : "في الوقت"}
            icon={Clock}
            color={stats.checkedInToday ? "emerald" : "amber"}
            onClick={() => onNavigate("attendance")}
          />
          <StatCard
            title="مهامي المفتوحة"
            value={stats.myOpenTasks}
            subtitle={`${stats.myOverdueTasks} متأخرة`}
            icon={CheckSquare}
            color="teal"
            onClick={() => onNavigate("tasks")}
          />
          <StatCard
            title="تقرير اليوم"
            value={stats.myTodayReport ? "مُقدَّم" : "معلّق"}
            icon={FileText}
            color={stats.myTodayReport ? "emerald" : "amber"}
            onClick={() => onNavigate("reports")}
          />
          <StatCard
            title="اجتماعاتي القادمة"
            value={stats.myUpcomingMeetings}
            icon={Calendar}
            color="blue"
            onClick={() => onNavigate("meetings")}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main column — Leaderboard or Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Announcements */}
          {data.announcements && data.announcements.length > 0 && (
            <Card className="border-emerald-100">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-emerald-600" />
                    أحدث الإعلانات
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-emerald-700"
                    onClick={() => onNavigate("announcements")}
                  >
                    عرض الكل
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
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
                      <h4 className="font-semibold text-sm text-emerald-900">{a.title}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                      {a.content}
                    </p>
                    <p className="text-xs text-emerald-600">
                      {a.creator?.name} • {timeAgoArabic(a.createdAt)}
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
                    المتصدرون هذا الأسبوع
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-amber-700"
                    onClick={() => onNavigate("leaderboard")}
                  >
                    عرض الكل
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
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
                          {m.name.split(" ").slice(0, 2).map((s: string) => s[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {DEPARTMENT_LABELS[m.department] || m.department}
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
                    مهامي الحالية
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-emerald-700"
                    onClick={() => onNavigate("tasks")}
                  >
                    عرض الكل
                    <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {data.myTasks.slice(0, 5).map((t: any) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-emerald-50/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        الموعد: {formatArabicDateTime(t.deadline)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`mr-2 text-xs ${
                        t.priority === "URGENT"
                          ? "border-red-200 text-red-700 bg-red-50"
                          : t.priority === "HIGH"
                          ? "border-amber-200 text-amber-700 bg-amber-50"
                          : "border-slate-200 text-slate-700"
                      }`}
                    >
                      {t.priority === "URGENT"
                        ? "عاجلة"
                        : t.priority === "HIGH"
                        ? "عالية"
                        : t.priority === "MEDIUM"
                        ? "متوسطة"
                        : "منخفضة"}
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
                  النشاط الأخير
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
                        <p className="text-xs text-muted-foreground">{a.reason}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-emerald-600">
                        +{a.amount}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {timeAgoArabic(a.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Side column — Quick actions / Overdue alerts */}
        <div className="space-y-6">
          {/* Overdue Alert */}
          {isTL && stats.overdueTasks > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-red-900">
                      {stats.overdueTasks} مهمة متأخرة
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      يرجى مراجعة المهام المتأخرة وإعادة جدولتها أو إعادة تكليفها.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 border-red-200 text-red-700 hover:bg-red-100"
                      onClick={() => onNavigate("tasks")}
                    >
                      مراجعة المهام
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
                  {ROLE_LABELS[user.role]}
                </Badge>
              </div>
              <p className="text-sm opacity-90">مجموع نقاطك</p>
              <p className="text-4xl font-bold mt-1">{user.totalPoints}</p>
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-white/20">
                <div>
                  <p className="text-xs opacity-75">هذا الأسبوع</p>
                  <p className="text-lg font-bold">{user.weeklyPoints}</p>
                </div>
                <div>
                  <p className="text-xs opacity-75">هذا الشهر</p>
                  <p className="text-lg font-bold">{user.monthlyPoints}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">إجراءات سريعة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => onNavigate("attendance")}
              >
                <Clock className="w-4 h-4 ml-2" />
                تسجيل الحضور
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => onNavigate("reports")}
              >
                <FileText className="w-4 h-4 ml-2" />
                تقديم التقرير اليومي
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => onNavigate("tasks")}
              >
                <CheckSquare className="w-4 h-4 ml-2" />
                عرض مهامي
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
        {subtitle && (
          <p className="text-xs opacity-70 mt-0.5">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
