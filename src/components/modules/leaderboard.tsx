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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Trophy,
  Medal,
  TrendingUp,
  Star,
  Heart,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import {
  ROLE_LABELS,
  DEPARTMENT_LABELS,
  ROLE_COLORS,
  timeAgoArabic,
} from "@/lib/auth-labels";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User } from "@/app/page";

interface Props {
  user: User;
}

export function LeaderboardModule({ user }: Props) {
  const [period, setPeriod] = useState("weekly");
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [kudos, setKudos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [kudosOpen, setKudosOpen] = useState(false);
  const [kudosTo, setKudosTo] = useState("");
  const [kudosReason, setKudosReason] = useState("");

  useEffect(() => {
    loadLeaderboard();
    loadTeam();
    loadKudos();
  }, [period]);

  const loadLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?period=${period}`);
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } finally {
      setLoading(false);
    }
  };

  const loadTeam = async () => {
    const res = await fetch("/api/team");
    const data = await res.json();
    setTeam((data.members || []).filter((m: any) => m.id !== user.id));
  };

  const loadKudos = async () => {
    const res = await fetch("/api/kudos");
    const data = await res.json();
    setKudos(data.kudos || []);
  };

  const handleSendKudos = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kudosTo || !kudosReason) {
      toast.error("يرجى اختيار عضو وكتابة سبب");
      return;
    }
    try {
      const res = await fetch("/api/kudos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toId: kudosTo, reason: kudosReason }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success(`تم إرسال التقدير • +${data.points} نقطة لـ ${data.kudos.to.name}`);
      setKudosOpen(false);
      setKudosTo("");
      setKudosReason("");
      loadKudos();
    } catch {
      toast.error("فشل إرسال التقدير");
    }
  };

  const periodLabels: Record<string, string> = {
    weekly: "هذا الأسبوع",
    monthly: "هذا الشهر",
    total: "الكل",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-emerald-900">
            لوحة المتصدرين
          </h1>
          <p className="text-muted-foreground mt-1">
            أفضل الأعضاء أداءً هذا الأسبوع
          </p>
        </div>

        <Dialog open={kudosOpen} onOpenChange={setKudosOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              <Heart className="w-4 h-4 ml-2" />
              إرسال تقدير
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>إرسال تقدير لزميل</DialogTitle>
              <DialogDescription>
                اعترف بعمل زميلك الممتاز. سيحصل على نقطتين إضافيتين.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSendKudos} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="kudosTo">الزميل</Label>
                <Select value={kudosTo} onValueChange={setKudosTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر زميلًا" />
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
              <div className="space-y-2">
                <Label htmlFor="kudosReason">السبب</Label>
                <Textarea
                  id="kudosReason"
                  value={kudosReason}
                  onChange={(e) => setKudosReason(e.target.value)}
                  placeholder="مثال: شكرًا على مساعدتك في حملة الأمس، كان عملك رائعًا!"
                  rows={3}
                  required
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setKudosOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit">
                  <Send className="w-4 h-4 ml-2" />
                  إرسال
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={period} onValueChange={setPeriod}>
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="weekly">أسبوعي</TabsTrigger>
          <TabsTrigger value="monthly">شهري</TabsTrigger>
          <TabsTrigger value="total">الكل</TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
            </div>
          ) : leaderboard.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">لا توجد بيانات بعد</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* Top 3 Podium */}
              {leaderboard.length >= 1 && (
                <div className="grid grid-cols-3 gap-2 mb-6">
                  {/* 2nd place */}
                  {leaderboard[1] && (
                    <PodiumCard
                      member={leaderboard[1]}
                      rank={2}
                      points={
                        period === "weekly"
                          ? leaderboard[1].weeklyPoints
                          : period === "monthly"
                          ? leaderboard[1].monthlyPoints
                          : leaderboard[1].totalPoints
                      }
                    />
                  )}
                  {/* 1st place */}
                  {leaderboard[0] && (
                    <PodiumCard
                      member={leaderboard[0]}
                      rank={1}
                      points={
                        period === "weekly"
                          ? leaderboard[0].weeklyPoints
                          : period === "monthly"
                          ? leaderboard[0].monthlyPoints
                          : leaderboard[0].totalPoints
                      }
                    />
                  )}
                  {/* 3rd place */}
                  {leaderboard[2] && (
                    <PodiumCard
                      member={leaderboard[2]}
                      rank={3}
                      points={
                        period === "weekly"
                          ? leaderboard[2].weeklyPoints
                          : period === "monthly"
                          ? leaderboard[2].monthlyPoints
                          : leaderboard[2].totalPoints
                      }
                    />
                  )}
                </div>
              )}

              {/* Rest of the list */}
              {leaderboard.slice(3).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      باقي المتصدرين — {periodLabels[period]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {leaderboard.slice(3).map((m, i) => {
                        const points =
                          period === "weekly"
                            ? m.weeklyPoints
                            : period === "monthly"
                            ? m.monthlyPoints
                            : m.totalPoints;
                        return (
                          <div
                            key={m.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30"
                          >
                            <span className="w-6 text-center text-sm font-bold text-muted-foreground">
                              {i + 4}
                            </span>
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
                              <p className="font-medium text-sm">{m.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {DEPARTMENT_LABELS[m.department]}
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={ROLE_COLORS[m.role]}
                            >
                              {ROLE_LABELS[m.role]}
                            </Badge>
                            <span className="font-bold text-amber-600">
                              {points}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Recent Kudos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-500" />
            أحدث التقديرات
          </CardTitle>
          <CardDescription>تقدير الأعضاء لبعضهم البعض</CardDescription>
        </CardHeader>
        <CardContent>
          {kudos.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">
              لا توجد تقديرات بعد. كن أول من يقدر زميله!
            </p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {kudos.map((k) => (
                <div
                  key={k.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-pink-50/50 border border-pink-100"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-pink-100 text-pink-700 text-xs">
                      {k.from.name
                        .split(" ")
                        .slice(0, 2)
                        .map((s: string) => s[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <strong>{k.from.name}</strong> أرسل تقديرًا إلى{" "}
                      <strong>{k.to.name}</strong>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      "{k.reason}"
                    </p>
                    <p className="text-xs text-pink-600 mt-1">
                      <Star className="w-3 h-3 inline ml-1" />
                      +{k.points} نقطة • {timeAgoArabic(k.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PodiumCard({
  member,
  rank,
  points,
}: {
  member: any;
  rank: number;
  points: number;
}) {
  const config: Record<
    number,
    { bg: string; border: string; icon: any; label: string }
  > = {
    1: {
      bg: "bg-gradient-to-b from-amber-50 to-amber-100",
      border: "border-amber-300",
      icon: Medal,
      label: "المركز الأول",
    },
    2: {
      bg: "bg-gradient-to-b from-slate-50 to-slate-100",
      border: "border-slate-300",
      icon: Medal,
      label: "المركز الثاني",
    },
    3: {
      bg: "bg-gradient-to-b from-orange-50 to-orange-100",
      border: "border-orange-300",
      icon: Medal,
      label: "المركز الثالث",
    },
  };
  const c = config[rank];
  const Icon = c.icon;

  return (
    <Card
      className={`${c.bg} ${c.border} ${
        rank === 1 ? "scale-105" : ""
      } text-center`}
    >
      <CardContent className="pt-4 pb-4">
        <Icon
          className={`w-7 h-7 mx-auto mb-2 ${
            rank === 1
              ? "text-amber-500"
              : rank === 2
              ? "text-slate-500"
              : "text-orange-500"
          }`}
        />
        <Avatar className="w-12 h-12 mx-auto mb-2 border-2 border-white">
          <AvatarFallback className="bg-white text-emerald-700 text-sm">
            {member.name
              .split(" ")
              .slice(0, 2)
              .map((s: string) => s[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <p className="font-semibold text-xs truncate">{member.name}</p>
        <p className="text-xs text-muted-foreground mt-1">{points} نقطة</p>
      </CardContent>
    </Card>
  );
}
