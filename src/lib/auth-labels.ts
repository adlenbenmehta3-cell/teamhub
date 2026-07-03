// Client-safe labels (no server-only imports)

export const ROLE_LABELS: Record<string, string> = {
  TEAM_LEADER: "قائد الفريق",
  SENIOR_MARKETER: "تسويقي أول",
  MARKETING_SPECIALIST: "أخصائي تسويق",
  JUNIOR_MARKETER: "تسويقي مبتدئ",
  GUEST: "زائر",
};

export const DEPARTMENT_LABELS: Record<string, string> = {
  SOCIAL_MEDIA: "التواصل الاجتماعي",
  CONTENT_CREATION: "إنشاء المحتوى",
  SEO_ANALYTICS: "تحسين محركات البحث والتحليلات",
  PAID_ADS: "الإعلانات المدفوعة",
  EMAIL_MARKETING: "التسويق عبر البريد",
  GENERAL: "عام",
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  LOW: "منخفضة",
  MEDIUM: "متوسطة",
  HIGH: "عالية",
  URGENT: "عاجلة",
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  OPEN: "مفتوحة",
  IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "مكتملة",
  CANCELLED: "ملغاة",
};

export const RECURRENCE_PATTERN_LABELS: Record<string, string> = {
  DAILY: "يومي",
  WEEKLY: "أسبوعي",
  MONTHLY: "شهري",
  WEEKDAYS: "أيام العمل",
};

export const MEETING_TYPE_LABELS: Record<string, string> = {
  STANDUP: "اجتماع يومي",
  WEEKLY: "اجتماع أسبوعي",
  PROJECT_REVIEW: "مراجعة مشروع",
  ONE_ON_ONE: "اجتماع فردي",
  BRAINSTORM: "جلسة عصف ذهني",
  GENERAL: "اجتماع عام",
};

export const KB_CATEGORY_LABELS: Record<string, string> = {
  PLAYBOOK: "دليل إجرائي",
  TEMPLATE: "قالب",
  BRAND_GUIDE: "دليل العلامة",
  TOOL_TUTORIAL: "شرح أداة",
  CASE_STUDY: "دراسة حالة",
  FAQ: "أسئلة شائعة",
};

export const ROLE_COLORS: Record<string, string> = {
  TEAM_LEADER: "bg-primary/10 text-primary border-primary/30",
  SENIOR_MARKETER: "bg-muted text-foreground border-border",
  MARKETING_SPECIALIST: "bg-muted text-foreground border-border",
  JUNIOR_MARKETER: "bg-muted text-muted-foreground border-border",
  GUEST: "bg-muted text-muted-foreground border-border",
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-muted text-muted-foreground border-border",
  MEDIUM: "bg-muted text-foreground border-border",
  HIGH: "bg-primary/10 text-primary border-primary/30",
  URGENT: "bg-destructive/10 text-destructive border-destructive/30",
};

export const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-primary/10 text-primary border-primary/30",
  IN_PROGRESS: "bg-muted text-foreground border-border",
  COMPLETED: "bg-muted text-muted-foreground border-border",
  CANCELLED: "bg-muted text-muted-foreground border-border",
};

// Helper to format date in Arabic
export function formatArabicDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("ar", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatEnglishDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatArabicDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("ar", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatEnglishDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatArabicTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("ar", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatEnglishTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} دقيقة`;
  if (m === 0) return `${h} ساعة`;
  return `${h} س ${m} د`;
}

export function timeAgoArabic(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 60) return "الآن";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `منذ ${minutes} د`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} س`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `منذ ${days} يوم`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `منذ ${weeks} أسبوع`;
  const months = Math.floor(days / 30);
  if (months < 12) return `منذ ${months} شهر`;
  return `منذ ${Math.floor(days / 365)} سنة`;
}

export function timeAgoEnglish(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
