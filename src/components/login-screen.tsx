"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, LogIn, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/app/page";

interface Props {
  onLogin: (user: User) => void;
}

export function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSeed, setShowSeed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("يرجى إدخال البريد وكلمة المرور");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "فشل تسجيل الدخول");
        return;
      }

      toast.success(`مرحبًا بك، ${data.user.name}!`);
      onLogin(data.user);
    } catch (e) {
      toast.error("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error);
        return;
      }
      toast.success("تم إنشاء البيانات التجريبية! استخدم البيانات أدناه للدخول");
      setEmail("leader@team.com");
      setPassword("leader123");
      setShowSeed(false);
    } catch {
      toast.error("فشل إنشاء البيانات التجريبية");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
            <Users className="w-9 h-9 text-white" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-emerald-900">TeamHub</h1>
          <p className="mt-1 text-sm text-emerald-600">منصة إدارة فريق التسويق</p>
        </div>

        <Card className="border-emerald-100 shadow-xl shadow-emerald-100/50">
          <CardHeader>
            <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
            <CardDescription>أدخل بياناتك للوصول إلى لوحة التحكم</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  dir="ltr"
                  placeholder="you@team.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-right"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-right"
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    جاري الدخول...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    دخول
                  </span>
                )}
              </Button>
            </form>

            {/* Seed demo data */}
            <div className="mt-6 pt-6 border-t border-emerald-100">
              {!showSeed ? (
                <Button
                  variant="ghost"
                  className="w-full text-emerald-700 hover:bg-emerald-50"
                  onClick={() => setShowSeed(true)}
                  disabled={loading}
                >
                  <Sparkles className="w-4 h-4 ml-2" />
                  أول مرة؟ أنشئ بيانات تجريبية
                </Button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground text-center">
                    سيؤدي هذا إلى إنشاء قائد فريق + 5 أعضاء، مهام، إعلان ترحيبي، واجتماع أسبوعي.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                    onClick={handleSeed}
                    disabled={loading}
                  >
                    <Sparkles className="w-4 h-4 ml-2" />
                    إنشاء البيانات التجريبية
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-xs"
                    onClick={() => setShowSeed(false)}
                  >
                    إلغاء
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © 2026 TeamHub — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
