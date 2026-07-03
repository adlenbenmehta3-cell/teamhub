"use client";

import { useEffect, useState } from "react";
import { LoginScreen } from "@/components/login-screen";
import { AppShell } from "@/components/app-shell";
import { useLanguage } from "@/components/language-provider";
import { toast } from "sonner";

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  title?: string | null;
  avatar?: string | null;
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
};

export default function Home() {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.user) {
        setUser(data.user);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (loggedUser: User) => {
    setUser(loggedUser);
    setActiveTab("dashboard");
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setUser(null);
    setActiveTab("dashboard");
    toast.success(t("logout.success"));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-border border-t-primary animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">
            {t("app.loading")}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <AppShell
      user={user}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={handleLogout}
    />
  );
}
