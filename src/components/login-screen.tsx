"use client";

import { useState } from "react";
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
import { ThemeToggle } from "@/components/theme-toggle";
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
      {/* Top-right controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center shadow-lg">
            <Users className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">Innov8 Brands</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("app.tagline")}
          </p>
        </div>

        {/* Admin-only notice */}
        <div className="mb-4 p-3 rounded-md border border-border bg-muted/50 flex items-start gap-2.5">
          <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {lang === "ar"
              ? "هذه المنصة مخصصة للأدمن فقط. الأدمن هو من ينشئ حسابات العمال. لا يوجد تسجيل ذاتي."
              : "This platform is admin-only. The admin creates worker accounts. No self-registration."}
          </p>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">
              {t("login.title")}
            </CardTitle>
            <CardDescription>{t("login.subtitle")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t("login.email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  dir="ltr"
                  placeholder="admin@team.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="text-left h-10"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t("login.password")}
                </Label>
                <Input
                  id="password"
                  type="password"
                  dir="ltr"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="text-left h-10"
                  disabled={loading}
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
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
        <div className="mt-4 p-3 rounded-md bg-muted/50 border border-border text-center">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            {lang === "ar" ? "بيانات دخول الأدمن" : "Admin credentials"}
          </p>
          <p className="text-xs text-foreground mt-1.5 font-mono" dir="ltr">
            admin@team.com / adlene123
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {t("login.copyright")}
        </p>
      </div>
    </div>
  );
}
