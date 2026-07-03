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
import { useLanguage } from "@/components/language-provider";
import {
 ROLE_COLORS,
 timeAgoArabic,
 timeAgoEnglish,
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
 const { t, lang } = useLanguage();
 const [period, setPeriod] = useState("weekly");
 const [leaderboard, setLeaderboard] = useState<any[]>([]);
 const [team, setTeam] = useState<any[]>([]);
 const [kudos, setKudos] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [kudosOpen, setKudosOpen] = useState(false);
 const [kudosTo, setKudosTo] = useState("");
 const [kudosReason, setKudosReason] = useState("");

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
 const timeAgo = lang === "ar" ? timeAgoArabic: timeAgoEnglish;

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
 setTeam((data.members || []).filter((m: any) => m.id!== user.id));
 };

 const loadKudos = async () => {
 const res = await fetch("/api/kudos");
 const data = await res.json();
 setKudos(data.kudos || []);
 };

 const handleSendKudos = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!kudosTo ||!kudosReason) {
 toast.error(t("leaderboard.kudosFillRequired"));
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
 toast.success(
 t("leaderboard.kudosSent", {
 points: data.points,
 name: data.kudos.to.name,
 })
 );
 setKudosOpen(false);
 setKudosTo("");
 setKudosReason("");
 loadKudos();
 } catch {
 toast.error(t("leaderboard.kudosFailed"));
 }
 };

 const periodLabels: Record<string, string> = {
 weekly: t("leaderboard.period.weekly"),
 monthly: t("leaderboard.period.monthly"),
 total: t("leaderboard.period.total"),
 };

 return (
 <div className="space-y-6">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
 {t("leaderboard.title")}
 </h1>
 <p className="text-muted-foreground mt-1">
 {t("leaderboard.subtitle")}
 </p>
 </div>

 <Dialog open={kudosOpen} onOpenChange={setKudosOpen}>
 <DialogTrigger asChild>
 <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
 <Heart className="w-4 h-4 ml-2" />
 {t("leaderboard.sendKudos")}
 </Button>
 </DialogTrigger>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>{t("leaderboard.kudosTitle")}</DialogTitle>
 <DialogDescription>
 {t("leaderboard.kudosDesc")}
 </DialogDescription>
 </DialogHeader>
 <form onSubmit={handleSendKudos} className="space-y-4">
 <div className="space-y-2">
 <Label htmlFor="kudosTo">{t("leaderboard.kudosTo")}</Label>
 <Select value={kudosTo} onValueChange={setKudosTo}>
 <SelectTrigger>
 <SelectValue placeholder={t("leaderboard.kudosTo.placeholder")} />
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
 <Label htmlFor="kudosReason">
 {t("leaderboard.kudosReason")}
 </Label>
 <Textarea
 id="kudosReason"
 value={kudosReason}
 onChange={(e) => setKudosReason(e.target.value)}
 placeholder={t("leaderboard.kudosReason.placeholder")}
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
 {t("common.cancel")}
 </Button>
 <Button type="submit">
 <Send className="w-4 h-4 ml-2" />
 {t("leaderboard.kudosSend")}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>
 </div>

 <Tabs value={period} onValueChange={setPeriod}>
 <TabsList className="grid w-full max-w-md grid-cols-3">
 <TabsTrigger value="weekly">{t("leaderboard.weekly")}</TabsTrigger>
 <TabsTrigger value="monthly">{t("leaderboard.monthly")}</TabsTrigger>
 <TabsTrigger value="total">{t("leaderboard.total")}</TabsTrigger>
 </TabsList>

 <TabsContent value={period} className="mt-4">
 {loading ? (
 <div className="flex items-center justify-center py-12">
 <div className="w-10 h-10 rounded-full border-4 border-border border-t-emerald-600 animate-spin" />
 </div>
 ): leaderboard.length === 0 ? (
 <Card>
 <CardContent className="py-12 text-center">
 <Trophy className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
 <p className="text-muted-foreground">
 {t("leaderboard.noData")}
 </p>
 </CardContent>
 </Card>
 ): (
 <div className="space-y-3">
 {leaderboard.length >= 1 && (
 <div className="grid grid-cols-3 gap-2 mb-6">
 {leaderboard[1] && (
 <PodiumCard
 member={leaderboard[1]}
 rank={2}
 points={
 period === "weekly"
 ? leaderboard[1].weeklyPoints: period === "monthly"
 ? leaderboard[1].monthlyPoints: leaderboard[1].totalPoints
 }
 t={t}
 />
 )}
 {leaderboard[0] && (
 <PodiumCard
 member={leaderboard[0]}
 rank={1}
 points={
 period === "weekly"
 ? leaderboard[0].weeklyPoints: period === "monthly"
 ? leaderboard[0].monthlyPoints: leaderboard[0].totalPoints
 }
 t={t}
 />
 )}
 {leaderboard[2] && (
 <PodiumCard
 member={leaderboard[2]}
 rank={3}
 points={
 period === "weekly"
 ? leaderboard[2].weeklyPoints: period === "monthly"
 ? leaderboard[2].monthlyPoints: leaderboard[2].totalPoints
 }
 t={t}
 />
 )}
 </div>
 )}

 {leaderboard.slice(3).length > 0 && (
 <Card>
 <CardHeader>
 <CardTitle className="text-base">
 {t("leaderboard.restTitle", {
 period: periodLabels[period],
 })}
 </CardTitle>
 </CardHeader>
 <CardContent>
 <div className="space-y-2">
 {leaderboard.slice(3).map((m, i) => {
 const points =
 period === "weekly"
 ? m.weeklyPoints: period === "monthly"
 ? m.monthlyPoints: m.totalPoints;
 return (
 <div
 key={m.id}
 className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30"
 >
 <span className="w-6 text-center text-sm font-bold text-muted-foreground">
 {i + 4}
 </span>
 <Avatar className="w-9 h-9">
 <AvatarFallback className="bg-muted text-foreground">
 {m.name.split(" ").slice(0, 2).map((s: string) => s[0]).join("")}
 </AvatarFallback>
 </Avatar>
 <div className="flex-1 min-w-0">
 <p className="font-medium text-sm">{m.name}</p>
 <p className="text-xs text-muted-foreground">
 {deptLabels[m.department]}
 </p>
 </div>
 <Badge
 variant="outline"
 className={ROLE_COLORS[m.role]}
 >
 {roleLabels[m.role]}
 </Badge>
 <span className="font-bold text-primary">
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
 <Heart className="w-5 h-5 text-primary" />
 {t("leaderboard.recentKudos")}
 </CardTitle>
 <CardDescription>
 {t("leaderboard.recentKudosDesc")}
 </CardDescription>
 </CardHeader>
 <CardContent>
 {kudos.length === 0 ? (
 <p className="text-center text-muted-foreground py-6">
 {t("leaderboard.noKudos")}
 </p>
 ): (
 <div className="space-y-3 max-h-96 overflow-y-auto">
 {kudos.map((k) => (
 <div
 key={k.id}
 className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 border border-border"
 >
 <Avatar className="w-8 h-8">
 <AvatarFallback className="bg-muted">
 {k.from.name.split(" ").slice(0, 2).map((s: string) => s[0]).join("")}
 </AvatarFallback>
 </Avatar>
 <div className="flex-1 min-w-0">
 <p className="text-sm">
 {t("leaderboard.kudosFromTo", {
 from: k.from.name,
 to: k.to.name,
 })}
 </p>
 <p className="text-xs text-muted-foreground mt-0.5">
 &ldquo;{k.reason}&rdquo;
 </p>
 <p className="text-xs text-primary mt-1">
 <Star className="w-3 h-3 inline ml-1" />+{k.points}{" "}
 {t("leaderboard.points")} • {timeAgo(k.createdAt)}
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
 t,
}: {
 member: any;
 rank: number;
 points: number;
 t: (key: string, vars?: any) => string;
}) {
 const config: Record<number, { bg: string; border: string }> = {
 1: {
 bg: "bg-primary text-primary-foreground",
 border: "border-border",
 },
 2: {
 bg: "bg-muted text-foreground",
 border: "border-border",
 },
 3: {
 bg: "bg-muted text-foreground",
 border: "border-border",
 },
 };
 const c = config[rank];

 return (
 <Card
 className={`${c.bg} ${c.border} ${rank === 1 ? "scale-105": ""} text-center`}
 >
 <CardContent className="pt-4 pb-4">
 <Medal
 className={`w-7 h-7 mx-auto mb-2 ${
 rank === 1
 ? "text-primary": rank === 2
 ? "text-muted-foreground": "text-primary"
 }`}
 />
 <Avatar className="w-12 h-12 mx-auto mb-2 border-2 border-white">
 <AvatarFallback className="bg-white text-primary text-sm">
 {member.name.split(" ").slice(0, 2).map((s: string) => s[0]).join("")}
 </AvatarFallback>
 </Avatar>
 <p className="font-semibold text-xs truncate">{member.name}</p>
 <p className="text-xs text-muted-foreground mt-1">
 {points} {t("leaderboard.points")}
 </p>
 </CardContent>
 </Card>
 );
}
