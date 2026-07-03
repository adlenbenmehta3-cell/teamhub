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
  TEAM_LEADER: "bg-emerald-100 text-emerald-700 border-emerald-200",
  SENIOR_MARKETER: "bg-teal-100 text-teal-700 border-teal-200",
  MARKETING_SPECIALIST: "bg-amber-100 text-amber-700 border-amber-200",
  JUNIOR_MARKETER: "bg-slate-100 text-slate-700 border-slate-200",
  GUEST: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-700 border-slate-200",
  MEDIUM: "bg-blue-100 text-blue-700 border-blue-200",
  HIGH: "bg-amber-100 text-amber-700 border-amber-200",
  URGENT: "bg-red-100 text-red-700 border-red-200",
};

export const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-100 text-blue-700 border-blue-200",
  IN_PROGRESS: "bg-amber-100 text-amber-700 border-amber-200",
  COMPLETED: "bg-emerald-100 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
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

export function formatArabicTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("ar", {
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
