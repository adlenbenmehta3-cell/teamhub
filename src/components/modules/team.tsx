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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
 Users,
 Plus,
 Trash2,
 Mail,
 Phone,
 Briefcase,
 Trophy,
 Edit2,
 Shield,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";
import {
 ROLE_LABELS,
 DEPARTMENT_LABELS,
 ROLE_COLORS,
} from "@/lib/auth-labels";
import type { User } from "@/app/page";

interface Props {
 user: User;
}

export function TeamModule({ user }: Props) {
 const { t, lang } = useLanguage();
 const [members, setMembers] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [createOpen, setCreateOpen] = useState(false);
 const [editMember, setEditMember] = useState<any | null>(null);

 const [name, setName] = useState("");
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [role, setRole] = useState("JUNIOR_MARKETER");
 const [department, setDepartment] = useState("GENERAL");
 const [titleField, setTitleField] = useState("");
 const [phone, setPhone] = useState("");

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

 useEffect(() => {
 loadMembers();
 }, []);

 const loadMembers = async () => {
 try {
 const res = await fetch("/api/team");
 const data = await res.json();
 setMembers(data.members || []);
 } finally {
 setLoading(false);
 }
 };

 const resetForm = () => {
 setName("");
 setEmail("");
 setPassword("");
 setRole("JUNIOR_MARKETER");
 setDepartment("GENERAL");
 setTitleField("");
 setPhone("");
 };

 const handleCreate = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!name ||!email ||!password) {
 toast.error(t("team.fillRequired"));
 return;
 }
 try {
 const res = await fetch("/api/team", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({
 name,
 email,
 password,
 role,
 department,
 title: titleField,
 phone,
 }),
 });
 const data = await res.json();
 if (!res.ok) {
 toast.error(data.error);
 return;
 }
 toast.success(t("team.added", { name }));
 setCreateOpen(false);
 resetForm();
 loadMembers();
 } catch {
 toast.error(t("team.addFailed"));
 }
 };

 const handleEdit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!editMember) return;
 try {
 const body: any = {
 name,
 role,
 department,
 title: titleField,
 phone,
 };
 if (password) body.password = password;

 const res = await fetch(`/api/team/${editMember.id}`, {
 method: "PATCH",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify(body),
 });
 const data = await res.json();
 if (!res.ok) {
 toast.error(data.error);
 return;
 }
 toast.success(t("team.updated"));
 setEditMember(null);
 resetForm();
 loadMembers();
 } catch {
 toast.error(t("team.updateFailed"));
 }
 };

 const handleDelete = async (id: string, memberName: string) => {
 if (!confirm(t("team.deleteConfirm", { name: memberName }))) return;
 try {
 const res = await fetch(`/api/team/${id}`, { method: "DELETE" });
 if (!res.ok) {
 toast.error(t("team.deleteFailed"));
 return;
 }
 toast.success(t("team.deleted", { name: memberName }));
 loadMembers();
 } catch {
 toast.error(t("team.deleteFailed"));
 }
 };

 const openEdit = (m: any) => {
 setEditMember(m);
 setName(m.name);
 setEmail(m.email);
 setPassword("");
 setRole(m.role);
 setDepartment(m.department);
 setTitleField(m.title || "");
 setPhone(m.phone || "");
 };

 if (loading) {
 return (
 <div className="flex items-center justify-center py-20">
 <div className="w-10 h-10 rounded-full border-4 border-border border-t-emerald-600 animate-spin" />
 </div>
 );
 }

 return (
 <div className="space-y-6">
 {/* Admin-only notice */}
 <div className="p-3 rounded-lg bg-muted/50">
 <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
 <p className="text-xs text-amber-800">
 {lang === "ar"
 ? "هذه الصفحة مخصصة للأدمن فقط. أنت الوحيد الذي يمكنه إنشاء وتعديل وحذف حسابات العمال. لا يوجد تسجيل ذاتي للعمال.": "This page is admin-only. Only you can create, edit, and delete worker accounts. Workers cannot self-register."}
 </p>
 </div>

 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div>
 <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
 {t("team.title")}
 </h1>
 <p className="text-muted-foreground mt-1">
 {t("team.subtitle", { count: members.length })}
 </p>
 </div>

 <Dialog
 open={createOpen ||!!editMember}
 onOpenChange={(o) => {
 if (!o) {
 setCreateOpen(false);
 setEditMember(null);
 resetForm();
 }
 }}
 >
 <DialogTrigger asChild>
 <Button
 className="bg-primary text-primary-foreground hover:bg-primary/90"
 onClick={() => setCreateOpen(true)}
 >
 <Plus className="w-4 h-4 ml-2" />
 {t("team.new")}
 </Button>
 </DialogTrigger>
 <DialogContent>
 <DialogHeader>
 <DialogTitle>
 {editMember ? t("team.editTitle"): t("team.createTitle")}
 </DialogTitle>
 <DialogDescription>
 {editMember ? t("team.editDesc"): t("team.createDesc")}
 </DialogDescription>
 </DialogHeader>
 <form
 onSubmit={editMember ? handleEdit: handleCreate}
 className="space-y-4"
 >
 <div className="space-y-2">
 <Label htmlFor="name">{t("team.name.label")} *</Label>
 <Input
 id="name"
 value={name}
 onChange={(e) => setName(e.target.value)}
 required
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="email">{t("team.email.label")} *</Label>
 <Input
 id="email"
 type="email"
 dir="ltr"
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 disabled={!!editMember}
 required
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="password">
 {t("team.password.label")}{" "}
 {editMember ? t("team.password.editHint"): "*"}
 </Label>
 <Input
 id="password"
 type="password"
 dir="ltr"
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 placeholder="••••••••"
 required={!editMember}
 />
 </div>
 <div className="grid grid-cols-2 gap-3">
 <div className="space-y-2">
 <Label htmlFor="role">{t("team.role.label")}</Label>
 <Select value={role} onValueChange={setRole}>
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="TEAM_LEADER">
 {t("role.team_leader")}
 </SelectItem>
 <SelectItem value="SENIOR_MARKETER">
 {t("role.senior_marketer")}
 </SelectItem>
 <SelectItem value="MARKETING_SPECIALIST">
 {t("role.marketing_specialist")}
 </SelectItem>
 <SelectItem value="JUNIOR_MARKETER">
 {t("role.junior_marketer")}
 </SelectItem>
 <SelectItem value="GUEST">{t("role.guest")}</SelectItem>
 </SelectContent>
 </Select>
 </div>
 <div className="space-y-2">
 <Label htmlFor="department">
 {t("team.department.label")}
 </Label>
 <Select value={department} onValueChange={setDepartment}>
 <SelectTrigger>
 <SelectValue />
 </SelectTrigger>
 <SelectContent>
 <SelectItem value="GENERAL">
 {t("dept.general")}
 </SelectItem>
 <SelectItem value="SOCIAL_MEDIA">
 {t("dept.social_media")}
 </SelectItem>
 <SelectItem value="CONTENT_CREATION">
 {t("dept.content_creation")}
 </SelectItem>
 <SelectItem value="SEO_ANALYTICS">
 {t("dept.seo_analytics")}
 </SelectItem>
 <SelectItem value="PAID_ADS">
 {t("dept.paid_ads")}
 </SelectItem>
 <SelectItem value="EMAIL_MARKETING">
 {t("dept.email_marketing")}
 </SelectItem>
 </SelectContent>
 </Select>
 </div>
 </div>
 <div className="space-y-2">
 <Label htmlFor="title">{t("team.jobTitle.label")}</Label>
 <Input
 id="title"
 value={titleField}
 onChange={(e) => setTitleField(e.target.value)}
 placeholder={t("team.jobTitle.placeholder")}
 />
 </div>
 <div className="space-y-2">
 <Label htmlFor="phone">{t("team.phone.label")}</Label>
 <Input
 id="phone"
 value={phone}
 onChange={(e) => setPhone(e.target.value)}
 dir="ltr"
 placeholder={t("team.phone.placeholder")}
 />
 </div>
 <DialogFooter>
 <Button
 type="button"
 variant="outline"
 onClick={() => {
 setCreateOpen(false);
 setEditMember(null);
 resetForm();
 }}
 >
 {t("common.cancel")}
 </Button>
 <Button
 type="submit"
 className="bg-primary text-primary-foreground hover:bg-primary/90"
 >
 {editMember ? t("team.save"): t("team.add")}
 </Button>
 </DialogFooter>
 </form>
 </DialogContent>
 </Dialog>
 </div>

 {/* Team Stats */}
 <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
 {Object.entries(roleLabels).map(([key, label]) => {
 const count = members.filter((m) => m.role === key).length;
 return (
 <Card key={key}>
 <CardContent className="pt-4 pb-4 text-center">
 <p className="text-2xl font-bold text-primary">{count}</p>
 <p className="text-xs text-muted-foreground mt-1">{label}</p>
 </CardContent>
 </Card>
 );
 })}
 </div>

 {/* Members List */}
 <Card>
 <CardHeader>
 <CardTitle>{t("team.members")}</CardTitle>
 <CardDescription>{t("team.membersDesc")}</CardDescription>
 </CardHeader>
 <CardContent>
 <div className="space-y-2">
 {members.map((m) => (
 <div
 key={m.id}
 className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50"
 >
 <Avatar className="w-11 h-11">
 <AvatarFallback className="bg-muted text-foreground">
 {m.name.split(" ").slice(0, 2).map((s) => s[0]).join("")}
 </AvatarFallback>
 </Avatar>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <p className="font-semibold text-sm">{m.name}</p>
 <Badge
 variant="outline"
 className={ROLE_COLORS[m.role]}
 >
 {roleLabels[m.role]}
 </Badge>
 </div>
 <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
 {m.title && (
 <span className="flex items-center gap-1">
 <Briefcase className="w-3 h-3" />
 {m.title}
 </span>
 )}
 <span className="flex items-center gap-1" dir="ltr">
 <Mail className="w-3 h-3" />
 {m.email}
 </span>
 {m.phone && (
 <span className="flex items-center gap-1" dir="ltr">
 <Phone className="w-3 h-3" />
 {m.phone}
 </span>
 )}
 </div>
 <p className="text-xs text-primary mt-0.5">
 {deptLabels[m.department]}
 </p>
 </div>

 <div className="flex items-center gap-2">
 <div className="text-center">
 <p className="text-xs text-muted-foreground flex items-center gap-1">
 <Trophy className="w-3 h-3" />
 {m.totalPoints}
 </p>
 <p className="text-xs text-primary font-semibold">
 {m.weeklyPoints}{" "}
 {lang === "ar" ? "هذا الأسبوع": "this week"}
 </p>
 </div>

 <Button
 variant="ghost"
 size="icon"
 className="text-primary hover:bg-muted"
 onClick={() => openEdit(m)}
 >
 <Edit2 className="w-4 h-4" />
 </Button>
 {m.id!== user.id && (
 <Button
 variant="ghost"
 size="icon"
 className="text-destructive hover:bg-destructive/5"
 onClick={() => handleDelete(m.id, m.name)}
 >
 <Trash2 className="w-4 h-4" />
 </Button>
 )}
 </div>
 </div>
 ))}
 </div>
 </CardContent>
 </Card>
 </div>
 );
}
