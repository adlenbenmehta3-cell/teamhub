"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  FileText,
  Users,
  Trophy,
  BookOpen,
  Megaphone,
  LogOut,
  Menu,
  X,
  Clock,
  ClipboardList,
  ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/components/language-provider";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { Dashboard } from "@/components/modules/dashboard";
import { AttendanceModule } from "@/components/modules/attendance";
import { TasksModule } from "@/components/modules/tasks";
import { ReportsModule } from "@/components/modules/reports";
import { MeetingsModule } from "@/components/modules/meetings";
import { LeaderboardModule } from "@/components/modules/leaderboard";
import { KnowledgeBaseModule } from "@/components/modules/knowledge-base";
import { AnnouncementsModule } from "@/components/modules/announcements";
import { TeamModule } from "@/components/modules/team";
import { WorkPlansModule } from "@/components/modules/work-plans";
import { ReviewModule } from "@/components/modules/review";
import type { User } from "@/app/page";

interface Props {
  user: User;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export function AppShell({ user, activeTab, onTabChange, onLogout }: Props) {
  const { t, lang } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isTL = user.role === "TEAM_LEADER";

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

  const NAV_ITEMS = [
    { id: "dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { id: "attendance", label: t("nav.attendance"), icon: Clock },
    { id: "tasks", label: t("nav.tasks"), icon: CheckSquare },
    { id: "workplans", label: t("nav.workplans"), icon: ClipboardList },
    { id: "reports", label: t("nav.reports"), icon: FileText },
    { id: "meetings", label: t("nav.meetings"), icon: Calendar },
    { id: "leaderboard", label: t("nav.leaderboard"), icon: Trophy },
    { id: "kb", label: t("nav.kb"), icon: BookOpen },
    { id: "announcements", label: t("nav.announcements"), icon: Megaphone },
  ];

  const TL_ONLY_ITEMS = [
    { id: "review", label: t("nav.review"), icon: ClipboardCheck },
    { id: "team", label: t("nav.team"), icon: Users },
  ];

  const navItems = [...NAV_ITEMS, ...(isTL ? TL_ONLY_ITEMS : [])];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard user={user} onNavigate={onTabChange} />;
      case "attendance":
        return <AttendanceModule user={user} />;
      case "tasks":
        return <TasksModule user={user} />;
      case "workplans":
        return <WorkPlansModule user={user} />;
      case "review":
        return <ReviewModule user={user} />;
      case "reports":
        return <ReportsModule user={user} />;
      case "meetings":
        return <MeetingsModule user={user} />;
      case "leaderboard":
        return <LeaderboardModule user={user} />;
      case "kb":
        return <KnowledgeBaseModule user={user} />;
      case "announcements":
        return <AnnouncementsModule user={user} />;
      case "team":
        return <TeamModule user={user} />;
      default:
        return <Dashboard user={user} onNavigate={onTabChange} />;
    }
  };

  const sidebarSideClass = lang === "ar" ? "right-0 border-l" : "left-0 border-r";
  const mainSideClass = lang === "ar" ? "lg:mr-64" : "lg:ml-64";

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-4 py-3 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(true)}
          className="text-foreground"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <Users className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-foreground">Innov8 Brands</span>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* Sidebar — Desktop */}
      <aside
        className={`hidden lg:flex fixed inset-y-0 ${sidebarSideClass} w-64 bg-sidebar border-sidebar-border flex-col z-20`}
      >
        <SidebarContent
          user={user}
          initials={initials}
          navItems={navItems}
          activeTab={activeTab}
          onTabChange={onTabChange}
          onLogout={onLogout}
        />
      </aside>

      {/* Sidebar — Mobile (Drawer) */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside
            className={`absolute inset-y-0 ${sidebarSideClass} w-72 bg-sidebar shadow-2xl flex flex-col`}
          >
            <div className="flex justify-between items-center p-4 border-b border-sidebar-border">
              <span className="font-bold text-sidebar-foreground">
                {t("nav.menu")}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="text-sidebar-foreground"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <SidebarContent
              user={user}
              initials={initials}
              navItems={navItems}
              activeTab={activeTab}
              onTabChange={(tab) => {
                onTabChange(tab);
                setSidebarOpen(false);
              }}
              onLogout={onLogout}
            />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className={`${mainSideClass} min-h-screen flex flex-col`}>
        <div className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {renderContent()}
        </div>

        {/* Footer */}
        <footer className="mt-auto border-t border-border bg-background py-4 px-4 lg:px-8">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              © 2026 Innov8 Brands —{" "}
              {lang === "ar"
                ? "منصة إدارة العلامة التجارية"
                : "Brand Management Platform"}
            </span>
            <span>
              {lang === "ar"
                ? "صُنع لإدارة العلامات"
                : "Built for brand management"}
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}

function SidebarContent({
  user,
  initials,
  navItems,
  activeTab,
  onTabChange,
  onLogout,
}: {
  user: User;
  initials: string;
  navItems: any[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}) {
  const { t, lang } = useLanguage();
  const roleLabels: Record<string, string> = {
    TEAM_LEADER: t("role.team_leader"),
    SENIOR_MARKETER: t("role.senior_marketer"),
    MARKETING_SPECIALIST: t("role.marketing_specialist"),
    JUNIOR_MARKETER: t("role.junior_marketer"),
    GUEST: t("role.guest"),
  };

  return (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Users className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-sidebar-foreground text-lg leading-tight">
              Innov8 Brands
            </h1>
            <p className="text-xs text-muted-foreground">
              {lang === "ar" ? "إدارة العلامة التجارية" : "Brand Management Hub"}
            </p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10 border border-border">
            <AvatarFallback className="bg-muted text-foreground font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-sidebar-foreground truncate">
              {user.name}
            </p>
            <p className="text-xs text-muted-foreground truncate" dir="ltr">
              {user.email}
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <Badge
            variant="outline"
            className="bg-muted text-foreground border-border text-xs font-medium"
          >
            {user.title || roleLabels[user.role] || user.role}
          </Badge>
          <span className="text-xs text-primary font-semibold flex items-center gap-1">
            <Trophy className="w-3 h-3" />
            {user.totalPoints} {lang === "ar" ? "نقطة" : "pts"}
          </span>
        </div>
        {/* Theme + Language switchers */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 ${
                      active ? "text-primary-foreground" : "text-muted-foreground"
                    }`}
                  />
                  <span className="flex-1 text-right">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive h-9"
          onClick={onLogout}
        >
          <LogOut className="w-4 h-4 ml-2" />
          {t("logout.button")}
        </Button>
      </div>
    </>
  );
}
