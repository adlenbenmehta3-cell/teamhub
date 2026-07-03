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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CalendarClock,
  ExternalLink,
  Folder,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";
import {
  DEPARTMENT_LABELS,
  formatArabicDate,
  formatEnglishDate,
  timeAgoArabic,
  timeAgoEnglish,
} from "@/lib/auth-labels";
import type { User } from "@/app/page";

interface Props {
  user: User;
}

export function ReportsModule({ user }: Props) {
  const { t, lang } = useLanguage();
  const [todayData, setTodayData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitOpen, setSubmitOpen] = useState(false);
  const isTL = user.role === "TEAM_LEADER";

  // Form
  const [completed, setCompleted] = useState("");
  const [inProgress, setInProgress] = useState("");
  const [blockers, setBlockers] = useState(
    lang === "ar" ? "لا يوجد" : "None"
  );
  const [tomorrow, setTomorrow] = useState("");
  const [driveLink, setDriveLink] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [todayRes, histRes] = await Promise.all([
        fetch("/api/reports/today"),
        fetch("/api/reports?limit=30"),
      ]);
      const today = await todayRes.json();
      const hist = await histRes.json();
      setTodayData(today);
      setHistory(hist.reports || []);

      // Pre-fill form if report exists
      if (today.myReport) {
        setCompleted(today.myReport.completed);
        setInProgress(today.myReport.inProgress);
        setBlockers(today.myReport.blockers || (lang === "ar" ? "لا يوجد" : "None"));
        setTomorrow(today.myReport.tomorrow || "");
        setDriveLink(today.myReport.driveLink || "");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completed || !inProgress) {
      toast.error(t("reports.fillRequired"));
      return;
    }
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          completed,
          inProgress,
          blockers,
          tomorrow,
          driveLink,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      if (data.updated) {
        toast.success(t("reports.updated"));
      } else {
        toast.success(t("reports.submitted", { points: data.points }));
      }
      setSubmitOpen(false);
      loadData();
    } catch {
      toast.error(t("reports.submitFailed"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
      </div>
    );
  }

  const todayDateStr = lang === "ar"
    ? formatArabicDate(new Date())
    : formatEnglishDate(new Date());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-emerald-900">
            {t("reports.title")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isTL ? t("reports.subtitle.leader") : t("reports.subtitle.member")}
          </p>
        </div>

        {!isTL && (
          <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                <Plus className="w-4 h-4 ml-2" />
                {todayData?.myReport ? t("reports.edit") : t("reports.submit")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {t("reports.dialogTitle", { date: todayDateStr })}
                </DialogTitle>
                <DialogDescription>
                  {t("reports.dialogDesc")}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="completed">
                    {t("reports.completed.label")} *
                  </Label>
                  <Textarea
                    id="completed"
                    value={completed}
                    onChange={(e) => setCompleted(e.target.value)}
                    placeholder={t("reports.completed.placeholder")}
                    rows={3}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="inProgress">
                    {t("reports.inProgress.label")} *
                  </Label>
                  <Textarea
                    id="inProgress"
                    value={inProgress}
                    onChange={(e) => setInProgress(e.target.value)}
                    placeholder={t("reports.inProgress.placeholder")}
                    rows={3}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blockers">
                    {t("reports.blockers.label")}
                  </Label>
                  <Textarea
                    id="blockers"
                    value={blockers}
                    onChange={(e) => setBlockers(e.target.value)}
                    placeholder={t("reports.blockers.placeholder")}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tomorrow">
                    {t("reports.tomorrow.label")}
                  </Label>
                  <Textarea
                    id="tomorrow"
                    value={tomorrow}
                    onChange={(e) => setTomorrow(e.target.value)}
                    placeholder={t("reports.tomorrow.placeholder")}
                    rows={2}
                  />
                </div>

                {/* Google Drive Link */}
                <div className="space-y-2 p-4 rounded-lg bg-emerald-50/50 border border-emerald-100">
                  <Label htmlFor="driveLink" className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-emerald-600" />
                    {t("reports.driveLink.label")}
                  </Label>
                  <Input
                    id="driveLink"
                    type="url"
                    dir="ltr"
                    value={driveLink}
                    onChange={(e) => setDriveLink(e.target.value)}
                    placeholder={t("reports.driveLink.placeholder")}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t("reports.driveLink.hint")}
                  </p>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSubmitOpen(false)}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-emerald-600 to-teal-600"
                  >
                    {t("reports.submitBtn")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Today's status (Member) */}
      {!isTL && (
        <Card
          className={
            todayData?.myReport
              ? "border-emerald-200"
              : "border-amber-200 bg-amber-50/30"
          }
        >
          <CardContent className="pt-4">
            {todayData?.myReport ? (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <p className="font-semibold text-emerald-900">
                    {t("reports.reportSubmitted")}
                  </p>
                </div>
                <div className="space-y-3">
                  <ReportField
                    icon={<CheckCircle2 className="w-4 h-4" />}
                    label={t("reports.fields.completed")}
                    value={todayData.myReport.completed}
                  />
                  <ReportField
                    icon={<Clock className="w-4 h-4" />}
                    label={t("reports.fields.inProgress")}
                    value={todayData.myReport.inProgress}
                  />
                  {todayData.myReport.blockers &&
                    todayData.myReport.blockers !== "لا يوجد" &&
                    todayData.myReport.blockers !== "None" && (
                      <ReportField
                        icon={<AlertTriangle className="w-4 h-4" />}
                        label={t("reports.fields.blockers")}
                        value={todayData.myReport.blockers}
                        warning
                      />
                    )}
                  {todayData.myReport.tomorrow &&
                    todayData.myReport.tomorrow !== "—" && (
                      <ReportField
                        icon={<CalendarClock className="w-4 h-4" />}
                        label={t("reports.fields.tomorrow")}
                        value={todayData.myReport.tomorrow}
                      />
                    )}
                  {/* Drive Link */}
                  {todayData.myReport.driveLink && (
                    <div className="flex gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                      <Folder className="w-4 h-4 text-emerald-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-muted-foreground mb-0.5">
                          {t("reports.fields.driveLink")}
                        </p>
                        <a
                          href={todayData.myReport.driveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-emerald-700 hover:underline flex items-center gap-1"
                          dir="ltr"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {t("reports.driveLink.view")}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-900">
                    {t("reports.notSubmittedYet")}
                  </p>
                  <p className="text-sm text-amber-700">
                    {t("reports.notSubmittedDesc")}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Team Reports (TL) */}
      {isTL && todayData?.team && (
        <Card>
          <CardHeader>
            <CardTitle>{t("reports.teamToday")}</CardTitle>
            <CardDescription>
              {t("reports.teamSummary", {
                submitted: todayData.submitted,
                total: todayData.total,
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[700px] overflow-y-auto">
              {todayData.team.map((member: any) => (
                <div
                  key={member.user.id}
                  className={`p-3 rounded-lg border ${
                    member.report
                      ? "border-emerald-100"
                      : "border-amber-100 bg-amber-50/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 text-xs">
                          {member.user.name
                            .split(" ")
                            .slice(0, 2)
                            .map((s: string) => s[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{member.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {DEPARTMENT_LABELS[member.user.department]}
                        </p>
                      </div>
                    </div>
                    {member.report ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-200 text-emerald-700 bg-emerald-50"
                      >
                        <CheckCircle2 className="w-3 h-3 ml-1" />
                        {t("reports.submitted")}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-amber-200 text-amber-700 bg-amber-50"
                      >
                        {t("reports.pending")}
                      </Badge>
                    )}
                  </div>
                  {member.report && (
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-xs font-semibold text-emerald-700 mb-0.5">
                          {t("reports.fields.completed")}:
                        </p>
                        <p className="text-muted-foreground">
                          {member.report.completed}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-teal-700 mb-0.5">
                          {t("reports.fields.inProgress")}:
                        </p>
                        <p className="text-muted-foreground">
                          {member.report.inProgress}
                        </p>
                      </div>
                      {member.report.blockers &&
                        member.report.blockers !== "لا يوجد" &&
                        member.report.blockers !== "None" && (
                          <div>
                            <p className="text-xs font-semibold text-amber-700 mb-0.5">
                              {t("reports.fields.blockers")}:
                            </p>
                            <p className="text-amber-900">
                              {member.report.blockers}
                            </p>
                          </div>
                        )}
                      {/* Drive Link */}
                      {member.report.driveLink && (
                        <div className="pt-2 mt-2 border-t border-emerald-50">
                          <p className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                            <Folder className="w-3 h-3" />
                            {t("reports.fields.driveLink")}:
                          </p>
                          <a
                            href={member.report.driveLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-700 hover:underline flex items-center gap-1"
                            dir="ltr"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {t("reports.driveLink.view")}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History (Member) */}
      {!isTL && (
        <Card>
          <CardHeader>
            <CardTitle>{t("reports.history")}</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                {t("reports.noHistory")}
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {history.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-lg border border-emerald-50 hover:bg-emerald-50/30"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">
                        {lang === "ar"
                          ? formatArabicDate(r.date)
                          : formatEnglishDate(r.date)}
                      </p>
                      {r.driveLink && (
                        <a
                          href={r.driveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-600 hover:underline flex items-center gap-1"
                        >
                          <Folder className="w-3 h-3" />
                          Drive
                        </a>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                      {r.completed}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReportField({
  icon,
  label,
  value,
  warning,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  warning?: boolean;
}) {
  return (
    <div className="flex gap-2">
      <div
        className={`mt-0.5 ${
          warning ? "text-amber-600" : "text-emerald-600"
        }`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs font-semibold text-muted-foreground mb-0.5">
          {label}
        </p>
        <p
          className={`text-sm whitespace-pre-line ${
            warning ? "text-amber-900" : "text-foreground"
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
