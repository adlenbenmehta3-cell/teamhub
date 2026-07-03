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
import { Clock, LogIn, LogOut, Calendar, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
  DEPARTMENT_LABELS,
  formatArabicDate,
  formatArabicTime,
  formatDuration,
} from "@/lib/auth-labels";
import type { User } from "@/app/page";

interface Props {
  user: User;
}

export function AttendanceModule({ user }: Props) {
  const [todayData, setTodayData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const isTL = user.role === "TEAM_LEADER";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [todayRes, histRes] = await Promise.all([
        fetch("/api/attendance/today"),
        fetch("/api/attendance?limit=30"),
      ]);
      const today = await todayRes.json();
      const hist = await histRes.json();
      setTodayData(today);
      setHistory(hist.records || []);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkin" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success(
        data.late
          ? `تم تسجيل الحضور (متأخر) • +${data.points} نقطة`
          : `تم تسجيل الحضور في الوقت • +${data.points} نقطة`
      );
      loadData();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout" }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success(
        `تم تسجيل الانصراف • مدة العمل: ${formatDuration(data.workMinutes)}`
      );
      loadData();
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const todayRecord = isTL
    ? null
    : history.find((r) => r.date === today);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-emerald-900">الحضور</h1>
        <p className="text-muted-foreground mt-1">
          {isTL
            ? "متابعة حضور الفريق اليوم"
            : "سجّل حضورك وانصرافك اليومي"}
        </p>
      </div>

      {/* Today's Check-in Card (Member View) */}
      {!isTL && (
        <Card className="border-emerald-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              حالة اليوم — {formatArabicDate(new Date())}
            </CardTitle>
            <CardDescription>
              {todayRecord
                ? todayRecord.checkOut
                  ? "أكملت يومك بنجاح!"
                  : "أنت مسجّل حضور. لا تنسَ تسجيل الانصراف عند المغادرة."
                : "لم تسجّل حضورك بعد اليوم"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayRecord ? (
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-emerald-50">
                  <p className="text-xs text-emerald-600 mb-1">الحضور</p>
                  <p className="text-lg font-bold text-emerald-900">
                    {formatArabicTime(todayRecord.checkIn)}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-teal-50">
                  <p className="text-xs text-teal-600 mb-1">الانصراف</p>
                  <p className="text-lg font-bold text-teal-900">
                    {todayRecord.checkOut
                      ? formatArabicTime(todayRecord.checkOut)
                      : "—"}
                  </p>
                </div>
                <div className="text-center p-3 rounded-lg bg-amber-50">
                  <p className="text-xs text-amber-600 mb-1">الحالة</p>
                  <p className="text-lg font-bold text-amber-900">
                    {todayRecord.late ? "متأخر" : "في الوقت"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-4">
                  لم تسجّل حضورك اليوم بعد
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleCheckIn}
                disabled={actionLoading || !!todayRecord}
                className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              >
                <LogIn className="w-4 h-4 ml-2" />
                تسجيل الحضور
              </Button>
              <Button
                onClick={handleCheckOut}
                disabled={actionLoading || !todayRecord || !!todayRecord.checkOut}
                variant="outline"
                className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              >
                <LogOut className="w-4 h-4 ml-2" />
                تسجيل الانصراف
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Attendance (TL View) */}
      {isTL && todayData?.team && (
        <Card>
          <CardHeader>
            <CardTitle>حضور الفريق اليوم</CardTitle>
            <CardDescription>
              {todayData.checkedIn} من {todayData.total} حاضر • {todayData.late} متأخر
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <div className="p-3 rounded-lg bg-emerald-50 text-center">
                <p className="text-2xl font-bold text-emerald-700">
                  {todayData.checkedIn}
                </p>
                <p className="text-xs text-emerald-600">حاضر</p>
              </div>
              <div className="p-3 rounded-lg bg-red-50 text-center">
                <p className="text-2xl font-bold text-red-700">
                  {todayData.notCheckedIn}
                </p>
                <p className="text-xs text-red-600">غائب</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 text-center">
                <p className="text-2xl font-bold text-amber-700">
                  {todayData.late}
                </p>
                <p className="text-xs text-amber-600">متأخر</p>
              </div>
              <div className="p-3 rounded-lg bg-teal-50 text-center">
                <p className="text-2xl font-bold text-teal-700">
                  {Math.round(
                    (todayData.checkedIn / Math.max(todayData.total, 1)) * 100
                  )}
                  %
                </p>
                <p className="text-xs text-teal-600">نسبة الحضور</p>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {todayData.team.map((member: any) => (
                <div
                  key={member.userId}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-emerald-50 hover:bg-emerald-50/30"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9">
                      <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 text-xs">
                        {member.name
                          .split(" ")
                          .slice(0, 2)
                          .map((s: string) => s[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{member.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {DEPARTMENT_LABELS[member.department] || member.department}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    {member.attendance ? (
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            member.attendance.late
                              ? "border-amber-200 text-amber-700 bg-amber-50"
                              : "border-emerald-200 text-emerald-700 bg-emerald-50"
                          }
                        >
                          {member.attendance.late ? "متأخر" : "في الوقت"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {member.attendance.checkOut
                            ? `خرج ${formatArabicTime(member.attendance.checkOut)}`
                            : `${formatArabicTime(member.attendance.checkIn)}`}
                        </span>
                      </div>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-red-200 text-red-700 bg-red-50"
                      >
                        غائب
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            سجل الحضور — آخر 30 يوم
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              لا يوجد سجل حضور بعد
            </p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {history.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-emerald-50 hover:bg-emerald-50/30"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {formatArabicDate(r.date)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatArabicTime(r.checkIn)}
                      {r.checkOut && ` → ${formatArabicTime(r.checkOut)}`}
                      {r.workMinutes > 0 && ` • ${formatDuration(r.workMinutes)}`}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      r.late
                        ? "border-amber-200 text-amber-700 bg-amber-50"
                        : "border-emerald-200 text-emerald-700 bg-emerald-50"
                    }
                  >
                    {r.late ? "متأخر" : "في الوقت"} • +{r.points}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
