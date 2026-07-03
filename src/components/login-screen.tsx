"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, LogIn, Shield } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { User } from "@/app/page";

interface Props {
  onLogin: (user: User) => void;
}

export function LoginScreen({ onLogin }: Props) {
  const { t, lang } = useLanguage();
  const [email, setEmail] = useState("admin@team.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error(
        lang === "ar"
          ? "يرجى إدخال البريد وكلمة المرور"
          : "Please enter email and password"
      );
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
        toast.error(data.error || t("login.loginError"));
        return;
      }

      toast.success(t("login.welcome", { name: data.user.name }));
      onLogin(data.user);
    } catch {
      toast.error(t("login.loginError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 relative">
      {/* Language switcher top-right */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-200">
            <Users className="w-9 h-9 text-white" />
          </div>
          <h1 className="mt-4 text-3xl font-bold text-emerald-900">TeamHub</h1>
          <p className="mt-1 text-sm text-emerald-600">{t("app.tagline")}</p>
        </div>

        {/* Admin-only notice */}
        <div className="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2">
          <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800">
            {lang === "ar"
              ? "هذه المنصة مخصصة للأدمن فقط. الأدمن هو من ينشئ حسابات العمال. لا يوجد تسجيل ذاتي."
              : "This platform is admin-only. The admin creates worker accounts. No self-registration."}
          </p>
        </div>

        <Card className="border-emerald-100 shadow-xl shadow-emerald-100/50">
          <CardHeader>
            <CardTitle className="text-2xl">{t("login.title")}</CardTitle>
            <CardDescription>{t("login.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("login.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  dir="ltr"
                  placeholder="admin@team.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-right"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t("login.password")}</Label>
                <Input
                  id="password"
                  type="password"
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-right"
                  disabled={loading}
                  autoFocus
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
                    {t("login.submitting")}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <LogIn className="w-4 h-4" />
                    {t("login.submit")}
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Admin credentials hint */}
        <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-center">
          <p className="text-xs text-emerald-800 font-medium">
            {lang === "ar"
              ? "بيانات دخول الأدمن | Admin credentials"
              : "Admin credentials"}
          </p>
          <p className="text-xs text-emerald-700 mt-1" dir="ltr">
            admin@team.com / adlene123
          </p>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {t("login.copyright")}
        </p>
      </div>
    </div>
  );
}
