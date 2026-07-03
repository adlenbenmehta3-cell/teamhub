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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, LogIn, Shield, Settings, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import type { User } from "@/app/page";

interface Props {
  onLogin: (user: User) => void;
}

export function LoginScreen({ onLogin }: Props) {
  const { t, lang } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupOpen, setSetupOpen] = useState(false);

  // Setup form
  const [setupName, setSetupName] = useState("");
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirm, setSetupConfirm] = useState("");

  // Check if setup is needed on mount
  useEffect(() => {
    checkSetupStatus();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const res = await fetch("/api/setup");
      const data = await res.json();
      setNeedsSetup(data.needsSetup);
      if (data.needsSetup) {
        setSetupOpen(true);
      }
    } catch {
      // ignore
    } finally {
      setCheckingSetup(false);
    }
  };

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

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupName || !setupPassword) {
      toast.error(
        lang === "ar"
          ? "يرجى إدخال الاسم وكلمة المرور"
          : "Please enter name and password"
      );
      return;
    }
    if (setupPassword.length < 6) {
      toast.error(
        lang === "ar"
          ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل"
          : "Password must be at least 6 characters"
      );
      return;
    }
    if (setupPassword !== setupConfirm) {
      toast.error(
        lang === "ar"
          ? "كلمتا المرور غير متطابقتين"
          : "Passwords do not match"
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: setupName,
          password: setupPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error);
        return;
      }

      toast.success(
        lang === "ar"
          ? `تم إنشاء حساب الأدمن بنجاح! مرحبًا ${data.user.name}`
          : `Admin account created! Welcome ${data.user.name}`
      );
      setSetupOpen(false);
      onLogin(data.user);
    } catch {
      toast.error(
        lang === "ar"
          ? "فشل إنشاء حساب الأدمن"
          : "Failed to create admin account"
      );
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (checkingSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
          <p className="text-emerald-700 text-sm font-medium">
            {lang === "ar" ? "جاري التحميل..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

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

            {/* First-time setup button — only show if needs setup */}
            {needsSetup && (
              <div className="mt-6 pt-6 border-t border-emerald-100">
                <Button
                  variant="outline"
                  className="w-full border-amber-200 text-amber-700 hover:bg-amber-50"
                  onClick={() => setSetupOpen(true)}
                  disabled={loading}
                >
                  <Settings className="w-4 h-4 ml-2" />
                  {lang === "ar"
                    ? "إعداد حساب الأدمن (أول مرة)"
                    : "Setup Admin Account (First Time)"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin credentials hint */}
        <div className="mt-4 text-center text-xs text-muted-foreground">
          {lang === "ar"
            ? "الأدمن الافتراضي: admin@team.com"
            : "Default admin: admin@team.com"}
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {t("login.copyright")}
        </p>
      </div>

      {/* Setup Dialog */}
      <Dialog open={setupOpen} onOpenChange={setSetupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              {lang === "ar"
                ? "إعداد حساب الأدمن"
                : "Setup Admin Account"}
            </DialogTitle>
            <DialogDescription>
              {lang === "ar"
                ? "هذا الإعداد يتم مرة واحدة فقط. أنت ستكون الأدمن الوحيد القادر على إنشاء حسابات العمال."
                : "This setup runs only once. You will be the only admin who can create worker accounts."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSetup} className="space-y-4">
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-emerald-800">
                {lang === "ar"
                  ? "البريد الإلكتروني للأدمن سيكون: admin@team.com (ثابت). اختر اسمك وكلمة المرور."
                  : "Admin email will be: admin@team.com (fixed). Choose your name and password."}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="setupName">
                {lang === "ar" ? "الاسم" : "Name"} *
              </Label>
              <Input
                id="setupName"
                value={setupName}
                onChange={(e) => setSetupName(e.target.value)}
                placeholder={lang === "ar" ? "اسمك الكامل" : "Your full name"}
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="setupPassword">
                {lang === "ar" ? "كلمة المرور" : "Password"} *
              </Label>
              <Input
                id="setupPassword"
                type="password"
                dir="ltr"
                value={setupPassword}
                onChange={(e) => setSetupPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
              <p className="text-xs text-muted-foreground">
                {lang === "ar"
                  ? "6 أحرف على الأقل"
                  : "At least 6 characters"}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="setupConfirm">
                {lang === "ar"
                  ? "تأكيد كلمة المرور"
                  : "Confirm Password"} *
              </Label>
              <Input
                id="setupConfirm"
                type="password"
                dir="ltr"
                value={setupConfirm}
                onChange={(e) => setSetupConfirm(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSetupOpen(false)}
                disabled={loading}
              >
                {t("common.cancel")}
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-emerald-600 to-teal-600"
                disabled={loading}
              >
                {loading
                  ? lang === "ar"
                    ? "جاري الإنشاء..."
                    : "Creating..."
                  : lang === "ar"
                  ? "إنشاء الحساب"
                  : "Create Account"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
