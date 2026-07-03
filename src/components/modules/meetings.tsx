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
import { Calendar, Plus, Clock, MapPin, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";
import {
 formatArabicDateTime,
 formatEnglishDateTime,
} from "@/lib/auth-labels";
import type { User } from "@/app/page";

interface Props {
 user: User;
}

export function MeetingsModule({ user }: Props) {
 const { t, lang } = useLanguage();
 const [meetings, setMeetings] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [createOpen, setCreateOpen] = useState(false);
 const isTL = user.role === "TEAM_LEADER";

 const [title, setTitle] = useState("");
 const [description, setDescription] = useState("");
 const [datetime, setDatetime] = useState("");
 const [duration, setDuration] = useState("30");
 const [type, setType] = useState("GENERAL");
 const [agenda, setAgenda] = useState("");
 const [location, setLocation] = useState(
 lang === "ar" ? "قاعة الاجتماعات": "Meeting Room"
 );

 const typeLabels: Record<string, string> = {
 STANDUP: t("meetings.type.standup"),
 WEEKLY: t("meetings.type.weekly"),
 PROJECT_REVIEW: t("meetings.type.project_review"),
 ONE_ON_ONE: t("meetings.type.one_on_one"),
 BRAINSTORM: t("meetings.type.brainstorm"),
 GENERAL: t("meetings.type.general"),
 };

 useEffect(() => {
 loadMeetings();
 }, []);

 const loadMeetings = async () => {
 try {
 const res = await fetch("/api/meetings?filter=upcoming");
 const data = await res.json();
 setMeetings(data.meetings || []);
 } finally {
 setLoading(false);
 }
 };

 const handleCreate = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!title ||!datetime) {
 toast.error(t("meetings.fillRequired"));
 return;
 }
 try {
 const res = await fetch("/api/meetings", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 title,
 description,
 datetime: new Date(datetime).toISOString(),
 durationMin: parseInt(duration),
 type,
 agenda,
 location,
 }),
 });
 const data = await res.json();
 if (!res.ok) {
 toast.error(data.error);
 return;
 }
 toast.success(t("meetings.scheduled"));
 setCreateOpen(false);
 setTitle("");
 setDescription("");
 setDatetime("");
 setDuration("30");
 setType("GENERAL");
 setAgenda("");
 loadMeetings();
 } catch {
 toast.error(t("meetings.scheduleFailed"));
 }
 };

 const handleAttend = async (meetingId: string) => {
 try {
 const res = await fetch(`/api/meetings/${meetingId}/attend`, {
 method: "POST",
 });
 const data = await res.json();
 if (!res.ok) {
 toast.error(data.error);
 return;
 }
 toast.success(t("meetings.attendanceRecorded", { points: data.points }));
 loadMeetings();
 } catch {
 toast.error(t("meetings.attendanceFailed"));
 }
 };

 if (loading) {
 return (
 <div className="flex items-center justify-center py-20">
 <div className="w-10 h-10 rounded-full border-4 border-border border-t-emerald-600 animate-spin" />
 </div>
 );
 }

 const formatDateTime =
 lang === "ar" ? formatArabicDateTime: formatEnglishDateTime;

 return (
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
 {t("meetings.title")}
 </h1>
 <p className="text-muted-foreground mt-1">
 {isTL
 ? t("meetings.subtitle.leader"): t("meetings.subtitle.member")}
 </p>
 </div>

 {isTL && (
 <Dialog open={createOpen} onOpenChange={setCreateOpen}>
 <DialogTrigger asChild>
 <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
 <Plus className="w-4 h-4 ml-2" />
 {t("meetings.new")}
 </Button>
 </DialogTrigger>
 <DialogContent className="max-w-lg">
 <DialogHeader>
 <DialogTitle>{t("meetings.createTitle")}</DialogTitle>
 <DialogDescription>
 {t("meetings.createDesc")}
 </DialogDescription>
 </DialogHeader>
 <form onSubmit={handleCreate} className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="title">{t("meetings.title.label")} *</Label>
 <Input
 id="title"
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder={t("meetings.title.placeholder")}
 required
 />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-2">
 <Label htmlFor="datetime">
 {t("meetings.datetime.label")} *
 </Label>
 <Input
 id="datetime"
 type="datetime-local"
 value={datetime}
 onChange={(e) => setDatetime(e.target.value)}
 required
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="duration">
 {t("meetings.duration.label")}
 </Label>
 <Input
 id="duration"
 type="number"
 min="5"
 value={duration}
 onChange={(e) => setDuration(e.target.value)}
 />
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="type">{t("meetings.type.label")}</Label>
 <Select value={type} onValueChange={setType}>
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="STANDUP">
 {t("meetings.type.standup")}
 </SelectItem>
 <SelectItem value="WEEKLY">
 {t("meetings.type.weekly")}
 </SelectItem>
 <SelectItem value="PROJECT_REVIEW">
 {t("meetings.type.project_review")}
 </SelectItem>
 <SelectItem value="ONE_ON_ONE">
 {t("meetings.type.one_on_one")}
 </SelectItem>
 <SelectItem value="BRAINSTORM">
 {t("meetings.type.brainstorm")}
 </SelectItem>
 <SelectItem value="GENERAL">
 {t("meetings.type.general")}
 </SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <Label htmlFor="location">
 {t("meetings.location.label")}
 </Label>
 <Input
 id="location"
 value={location}
 onChange={(e) => setLocation(e.target.value)}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="agenda">{t("meetings.agenda.label")}</Label>
 <Textarea
 id="agenda"
 value={agenda}
 onChange={(e) => setAgenda(e.target.value)}
 placeholder={t("meetings.agenda.placeholder")}
 rows={3}
 />
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
 {t("meetings.schedule")}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>
 )}
 </div>

 {meetings.length === 0 ? (
 <Card>
 <CardContent className="py-12 text-center">
 <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
 <p className="text-muted-foreground">
 {t("meetings.noMeetings")}
 </p>
 </CardContent>
 </Card>
 ): (
 <div className="space-y-3">
 {meetings.map((m) => {
 const attended = m.attendees?.some(
 (a: any) => a.userId === user.id && a.attended
 );

 return (
 <Card key={m.id} className="border-border">
 <CardContent className="pt-4">
 <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-2 flex-wrap">
 <Badge
 variant="outline"
 className="border-border text-primary bg-muted/50"
 >
 {typeLabels[m.type]}
 </Badge>
 {attended && (
 <Badge
 variant="outline"
 className="border-border text-primary bg-muted/50"
 >
 <CheckCircle2 className="w-3 h-3 ml-1" />
 {t("meetings.attended")}
 </Badge>
 )}
 </div>
 <h3 className="font-semibold text-foreground mb-2">
 {m.title}
 </h3>
 <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap mb-2">
 <span className="flex items-center gap-1">
 <Clock className="w-3 h-3" />
 {formatDateTime(m.datetime)}
 </span>
 <span>• {m.durationMin} {lang === "ar" ? "دقيقة": "min"}</span>
 <span className="flex items-center gap-1">
 <MapPin className="w-3 h-3" />
 {m.location}
 </span>
 </div>
 {m.description && (
 <p className="text-sm text-muted-foreground mb-2 whitespace-pre-line">
 {m.description}
 </p>
 )}
 {m.agenda && (
 <div className="mt-2 p-2 rounded bg-muted/50">
 <p className="text-xs font-semibold text-muted-foreground mb-1">
 {t("meetings.agenda.label")}:
 </p>
 <p className="text-sm whitespace-pre-line">
 {m.agenda}
 </p>
 </div>
 )}
 {m.attendees && m.attendees.length > 0 && (
 <p className="text-xs text-muted-foreground mt-2">
 {t("meetings.attendeesCount", {
 count: m.attendees.filter((a: any) => a.attended).length,
 })}
 </p>
 )}
 </div>

 {!attended && (
 <Button
 size="sm"
 onClick={() => handleAttend(m.id)}
 className="bg-primary text-primary-foreground hover:bg-primary/90 hover:bg-accent"
 >
 <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
 {t("meetings.attendBtn")}
 </Button>
 )}
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
