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
import { useLanguage } from "@/components/language-provider";
import {
 DEPARTMENT_LABELS,
 formatArabicDate,
 formatEnglishDate,
 formatArabicTime,
 formatEnglishTime,
 formatDuration,
} from "@/lib/auth-labels";
import type { User } from "@/app/page";

interface Props {
 user: User;
}

export function AttendanceModule({ user }: Props) {
 const { t, lang } = useLanguage();
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
 ? t("attendance.checkedInLate", { points: data.points }): t("attendance.checkedInOnTime", { points: data.points })
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
 t("attendance.checkedOut", { duration: formatDuration(data.workMinutes) })
 );
 loadData();
 } finally {
 setActionLoading(false);
 }
 };

 if (loading) {
 return (
 <div className="flex items-center justify-center py-20">
 <div className="w-10 h-10 rounded-full border-4 border-border border-t-emerald-600 animate-spin" />
 </div>
 );
 }

 const today = new Date().toISOString().split("T")[0];
 const todayRecord = isTL ? null: history.find((r) => r.date === today);

 const formatDate = lang === "ar" ? formatArabicDate: formatEnglishDate;
 const formatTime = lang === "ar" ? formatArabicTime: formatEnglishTime;

 return (
 <div className="space-y-6">
 <div>
 <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
 {t("attendance.title")}
 </h1>
 <p className="text-muted-foreground mt-1">
 {isTL
 ? t("attendance.subtitle.leader"): t("attendance.subtitle.member")}
 </p>
 </div>

 {/* Today's Check-in Card (Member View) */}
 {!isTL && (
 <Card className="border-border">
 <CardHeader>
 <CardTitle className="flex items-center gap-2">
 <Clock className="w-5 h-5 text-primary" />
 {t("attendance.todayStatus")} — {formatDate(new Date())}
 </CardTitle>
 <CardDescription>
 {todayRecord
 ? todayRecord.checkOut
 ? t("attendance.completedDay"): t("attendance.checkedInNotOut"): t("attendance.notCheckedIn")}
 </CardDescription>
 </CardHeader>
 <CardContent className="space-y-4">
 {todayRecord ? (
 <div className="grid grid-cols-3 gap-3">
 <div className="text-center p-3 rounded-lg bg-muted/50">
 <p className="text-xs text-primary mb-1">
 {t("attendance.checkIn")}
 </p>
 <p className="text-lg font-bold text-foreground">
 {formatTime(todayRecord.checkIn)}
 </p>
 </div>
 <div className="text-center p-3 rounded-lg bg-muted/50">
 <p className="text-xs text-primary mb-1">
 {t("attendance.checkOut")}
 </p>
 <p className="text-lg font-bold text-foreground">
 {todayRecord.checkOut
 ? formatTime(todayRecord.checkOut): "—"}
 </p>
 </div>
 <div className="text-center p-3 rounded-lg bg-muted/50">
 <p className="text-xs text-primary mb-1">
 {t("attendance.status")}
 </p>
 <p className="text-lg font-bold text-foreground">
 {todayRecord.late
 ? t("attendance.late"): t("attendance.onTime")}
 </p>
 </div>
 </div>
 ): (
 <div className="text-center py-6">
 <AlertCircle className="w-10 h-10 text-primary mx-auto mb-2" />
 <p className="text-sm text-muted-foreground mb-4">
 {t("attendance.notRecordedYet")}
 </p>
 </div>
 )}

 <div className="flex gap-2">
 <Button
 onClick={handleCheckIn}
 disabled={actionLoading ||!!todayRecord}
 className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
 >
 <LogIn className="w-4 h-4 ml-2" />
 {t("attendance.checkInBtn")}
 </Button>
 <Button
 onClick={handleCheckOut}
 disabled={
 actionLoading ||!todayRecord ||!!todayRecord.checkOut
 }
 variant="outline"
 className="flex-1 border-border text-primary hover:bg-muted/50"
 >
 <LogOut className="w-4 h-4 ml-2" />
 {t("attendance.checkOutBtn")}
 </Button>
 </div>
 </CardContent>
 </Card>
 )}

 {/* Team Attendance (TL View) */}
 {isTL && todayData?.team && (
 <Card>
 <CardHeader>
 <CardTitle>{t("attendance.teamToday")}</CardTitle>
 <CardDescription>
 {t("attendance.teamSummary", {
 checked: todayData.checkedIn,
 total: todayData.total,
 late: todayData.late,
 })}
 </CardDescription>
 </CardHeader>
 <CardContent>
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
 <div className="p-3 rounded-lg bg-muted/50">
 <p className="text-2xl font-bold text-primary">
 {todayData.checkedIn}
 </p>
 <p className="text-xs text-primary">
 {t("attendance.present")}
 </p>
 </div>
 <div className="p-3 rounded-lg bg-destructive/5">
 <p className="text-2xl font-bold text-destructive">
 {todayData.notCheckedIn}
 </p>
 <p className="text-xs text-destructive">
 {t("dashboard.absent")}
 </p>
 </div>
 <div className="p-3 rounded-lg bg-muted/50">
 <p className="text-2xl font-bold text-primary">
 {todayData.late}
 </p>
 <p className="text-xs text-primary">
 {t("attendance.late")}
 </p>
 </div>
 <div className="p-3 rounded-lg bg-muted/50">
 <p className="text-2xl font-bold text-primary">
 {Math.round(
 (todayData.checkedIn / Math.max(todayData.total, 1)) * 100
 )}
 %
 </p>
 <p className="text-xs text-primary">
 {t("attendance.attendanceRate")}
 </p>
 </div>
 </div>

 <div className="space-y-2 max-h-96 overflow-y-auto">
 {todayData.team.map((member: any) => (
 <div
 key={member.userId}
 className="flex items-center justify-between p-2.5 rounded-lg border border-border hover:bg-muted/50"
 >
 <div className="flex items-center gap-3">
 <Avatar className="w-9 h-9">
 <AvatarFallback className="bg-muted text-foreground">
 {member.name.split(" ").slice(0, 2).map((s: string) => s[0]).join("")}
 </AvatarFallback>
 </Avatar>
 <div>
 <p className="font-medium text-sm">{member.name}</p>
 <p className="text-xs text-muted-foreground">
 {DEPARTMENT_LABELS[member.department] ||
 member.department}
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
 ? "border-border text-primary bg-muted/50": "border-border text-primary bg-muted/50"
 }
 >
 {member.attendance.late
 ? t("attendance.late"): t("attendance.onTime")}
 </Badge>
 <span className="text-xs text-muted-foreground">
 {member.attendance.checkOut
 ? `${formatTime(member.attendance.checkOut)}`: `${formatTime(member.attendance.checkIn)}`}
 </span>
 </div>
 ): (
 <Badge
 variant="outline"
 className="border-destructive/40 text-destructive bg-destructive/5"
 >
 {t("dashboard.absent")}
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
 <Calendar className="w-5 h-5 text-primary" />
 {t("attendance.history")}
 </CardTitle>
 </CardHeader>
 <CardContent>
 {history.length === 0 ? (
 <p className="text-center text-muted-foreground py-8">
 {t("attendance.noHistory")}
 </p>
 ): (
 <div className="space-y-2 max-h-96 overflow-y-auto">
 {history.map((r) => (
 <div
 key={r.id}
 className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50"
 >
 <div>
 <p className="font-medium text-sm">{formatDate(r.date)}</p>
 <p className="text-xs text-muted-foreground">
 {formatTime(r.checkIn)}
 {r.checkOut && ` → ${formatTime(r.checkOut)}`}
 {r.workMinutes > 0 &&
 ` • ${formatDuration(r.workMinutes)}`}
 </p>
 </div>
 <Badge
 variant="outline"
 className={
 r.late
 ? "border-border text-primary bg-muted/50": "border-border text-primary bg-muted/50"
 }
 >
 {r.late ? t("attendance.late"): t("attendance.onTime")} • +
 {r.points}
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
