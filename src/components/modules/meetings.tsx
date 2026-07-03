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
import {
  MEETING_TYPE_LABELS,
  formatArabicDateTime,
} from "@/lib/auth-labels";
import type { User } from "@/app/page";

interface Props {
  user: User;
}

export function MeetingsModule({ user }: Props) {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const isTL = user.role === "TEAM_LEADER";

  // Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [datetime, setDatetime] = useState("");
  const [duration, setDuration] = useState("30");
  const [type, setType] = useState("GENERAL");
  const [agenda, setAgenda] = useState("");
  const [location, setLocation] = useState("قاعة الاجتماعات");

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
    if (!title || !datetime) {
      toast.error("يرجى تعبئة العنوان والوقت");
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
      toast.success("تم جدولة الاجتماع");
      setCreateOpen(false);
      setTitle("");
      setDescription("");
      setDatetime("");
      setDuration("30");
      setType("GENERAL");
      setAgenda("");
      setLocation("قاعة الاجتماعات");
      loadMeetings();
    } catch {
      toast.error("فشل جدولة الاجتماع");
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
      toast.success(`تم تسجيل حضورك • +${data.points} نقطة`);
      loadMeetings();
    } catch {
      toast.error("فشل تسجيل الحضور");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-emerald-900">
            الاجتماعات
          </h1>
          <p className="text-muted-foreground mt-1">
            {isTL ? "جدولة اجتماعات الفريق" : "متابعة الاجتماعات القادمة"}
          </p>
        </div>

        {isTL && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                <Plus className="w-4 h-4 ml-2" />
                اجتماع جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>جدولة اجتماع جديد</DialogTitle>
                <DialogDescription>املأ تفاصيل الاجتماع</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">العنوان *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="مثال: اجتماع الفريق الأسبوعي"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="datetime">الوقت *</Label>
                    <Input
                      id="datetime"
                      type="datetime-local"
                      value={datetime}
                      onChange={(e) => setDatetime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="duration">المدة (دقيقة)</Label>
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
                  <Label htmlFor="type">النوع</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STANDUP">اجتماع يومي</SelectItem>
                      <SelectItem value="WEEKLY">اجتماع أسبوعي</SelectItem>
                      <SelectItem value="PROJECT_REVIEW">مراجعة مشروع</SelectItem>
                      <SelectItem value="ONE_ON_ONE">اجتماع فردي</SelectItem>
                      <SelectItem value="BRAINSTORM">عصف ذهني</SelectItem>
                      <SelectItem value="GENERAL">اجتماع عام</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">المكان</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="agenda">جدول الأعمال</Label>
                  <Textarea
                    id="agenda"
                    value={agenda}
                    onChange={(e) => setAgenda(e.target.value)}
                    placeholder="بنود جدول الأعمال..."
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateOpen(false)}
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-emerald-600 to-teal-600"
                  >
                    جدولة
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Meetings List */}
      {meetings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">لا توجد اجتماعات قادمة</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {meetings.map((m) => {
            const attended = m.attendees?.some(
              (a: any) => a.userId === user.id && a.attended
            );

            return (
              <Card key={m.id} className="border-emerald-100">
                <CardContent className="pt-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge
                          variant="outline"
                          className="border-emerald-200 text-emerald-700 bg-emerald-50"
                        >
                          {MEETING_TYPE_LABELS[m.type]}
                        </Badge>
                        {attended && (
                          <Badge
                            variant="outline"
                            className="border-emerald-300 text-emerald-700 bg-emerald-50"
                          >
                            <CheckCircle2 className="w-3 h-3 ml-1" />
                            حضرت
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-semibold text-emerald-900 mb-2">
                        {m.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap mb-2">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatArabicDateTime(m.datetime)}
                        </span>
                        <span>• {m.durationMin} دقيقة</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {m.location}
                        </span>
                      </div>
                      {m.description && (
                        <p className="text-sm text-muted-foreground mb-2">
                          {m.description}
                        </p>
                      )}
                      {m.agenda && (
                        <div className="mt-2 p-2 rounded bg-muted/50">
                          <p className="text-xs font-semibold text-muted-foreground mb-1">
                            جدول الأعمال:
                          </p>
                          <p className="text-sm whitespace-pre-line">{m.agenda}</p>
                        </div>
                      )}
                      {m.attendees && m.attendees.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          حضره: {m.attendees.filter((a: any) => a.attended).length} أشخاص
                        </p>
                      )}
                    </div>

                    {!attended && (
                      <Button
                        size="sm"
                        onClick={() => handleAttend(m.id)}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 ml-1" />
                        تسجيل الحضور
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
