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
} from "lucide-react";
import { toast } from "sonner";
import {
  ROLE_LABELS,
  DEPARTMENT_LABELS,
  ROLE_COLORS,
  formatArabicDate,
} from "@/lib/auth-labels";
import type { User } from "@/app/page";

interface Props {
  user: User;
}

export function TeamModule({ user }: Props) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editMember, setEditMember] = useState<any | null>(null);

  // Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("JUNIOR_MARKETER");
  const [department, setDepartment] = useState("GENERAL");
  const [title, setTitle] = useState("");
  const [phone, setPhone] = useState("");

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
    setTitle("");
    setPhone("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("يرجى تعبئة الحقول المطلوبة");
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
          title,
          phone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success(`تمت إضافة ${name} للفريق`);
      setCreateOpen(false);
      resetForm();
      loadMembers();
    } catch {
      toast.error("فشل إضافة العضو");
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
        title,
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
      toast.success("تم تحديث بيانات العضو");
      setEditMember(null);
      resetForm();
      loadMembers();
    } catch {
      toast.error("فشل التحديث");
    }
  };

  const handleDelete = async (id: string, memberName: string) => {
    if (!confirm(`هل أنت متأكد من حذف ${memberName}؟`)) return;
    try {
      const res = await fetch(`/api/team/${id}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("فشل الحذف");
        return;
      }
      toast.success(`تم حذف ${memberName}`);
      loadMembers();
    } catch {
      toast.error("فشل الحذف");
    }
  };

  const openEdit = (m: any) => {
    setEditMember(m);
    setName(m.name);
    setEmail(m.email);
    setPassword("");
    setRole(m.role);
    setDepartment(m.department);
    setTitle(m.title || "");
    setPhone(m.phone || "");
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
            إدارة الفريق
          </h1>
          <p className="text-muted-foreground mt-1">
            {members.length} عضو في الفريق
          </p>
        </div>

        <Dialog
          open={createOpen || !!editMember}
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
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="w-4 h-4 ml-2" />
              عضو جديد
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editMember ? "تعديل عضو" : "إضافة عضو جديد"}
              </DialogTitle>
              <DialogDescription>
                {editMember
                  ? "عدّل بيانات العضو"
                  : "أضف عضوًا جديدًا للفريق"}
              </DialogDescription>
            </DialogHeader>
            <form
              onSubmit={editMember ? handleEdit : handleCreate}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">الاسم *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني *</Label>
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
                  كلمة المرور {editMember ? "(اتركها فارغة للإبقاء على الحالية)" : "*"}
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
                  <Label htmlFor="role">الدور</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TEAM_LEADER">قائد الفريق</SelectItem>
                      <SelectItem value="SENIOR_MARKETER">تسويقي أول</SelectItem>
                      <SelectItem value="MARKETING_SPECIALIST">أخصائي تسويق</SelectItem>
                      <SelectItem value="JUNIOR_MARKETER">تسويقي مبتدئ</SelectItem>
                      <SelectItem value="GUEST">زائر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">القسم</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GENERAL">عام</SelectItem>
                      <SelectItem value="SOCIAL_MEDIA">التواصل الاجتماعي</SelectItem>
                      <SelectItem value="CONTENT_CREATION">إنشاء المحتوى</SelectItem>
                      <SelectItem value="SEO_ANALYTICS">SEO والتحليلات</SelectItem>
                      <SelectItem value="PAID_ADS">الإعلانات المدفوعة</SelectItem>
                      <SelectItem value="EMAIL_MARKETING">التسويق عبر البريد</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">المسمى الوظيفي</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: مدير حسابات التواصل"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  dir="ltr"
                  placeholder="+213..."
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
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-emerald-600 to-teal-600"
                >
                  {editMember ? "حفظ" : "إضافة"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {Object.entries(ROLE_LABELS).map(([key, label]) => {
          const count = members.filter((m) => m.role === key).length;
          return (
            <Card key={key}>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-bold text-emerald-700">{count}</p>
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Members List */}
      <Card>
        <CardHeader>
          <CardTitle>أعضاء الفريق</CardTitle>
          <CardDescription>إدارة الأعضاء وأدوارهم</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-emerald-50 hover:bg-emerald-50/30"
              >
                <Avatar className="w-11 h-11">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 font-bold">
                    {m.name
                      .split(" ")
                      .slice(0, 2)
                      .map((s) => s[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm">{m.name}</p>
                    <Badge
                      variant="outline"
                      className={ROLE_COLORS[m.role]}
                    >
                      {ROLE_LABELS[m.role]}
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
                  <p className="text-xs text-emerald-600 mt-0.5">
                    {DEPARTMENT_LABELS[m.department]}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      {m.totalPoints}
                    </p>
                    <p className="text-xs text-amber-600 font-semibold">
                      {m.weeklyPoints} هذا الأسبوع
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-emerald-700 hover:bg-emerald-100"
                    onClick={() => openEdit(m)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  {m.id !== user.id && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:bg-red-50"
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
