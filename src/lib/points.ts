/**
 * Points system configuration and helper functions.
 */

export const POINTS_CONFIG = {
  on_time_checkin: 2,
  late_checkin: 1,
  task_completed: 5,
  task_completed_early: 7,
  daily_report_submitted: 3,
  meeting_attended: 4,
  kudos_received: 2,
} as const;

export const POINTS_LABELS: Record<string, string> = {
  on_time_checkin: "تسجيل حضور في الوقت",
  late_checkin: "تسجيل حضور متأخر",
  task_completed: "إتمام مهمة",
  task_completed_early: "إتمام مهمة مبكرًا",
  daily_report_submitted: "تقديم تقرير يومي",
  meeting_attended: "حضور اجتماع",
  kudos_received: "تقدير من زميل",
};

// Schedule config (in 24-hour format, server timezone)
export const SCHEDULE_CONFIG = {
  morning_reminder: "09:00",
  check_in_deadline: "10:00",
  report_reminder: "17:00",
  report_deadline: "18:00",
  weekly_summary_day: 5, // Friday (0=Sun, 5=Fri)
  weekly_summary_time: "16:00",
};

/**
 * Format a date as YYYY-MM-DD (local time).
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Format a datetime for display in Arabic.
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("ar", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("ar", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Check if a check-in is late based on configured deadline.
 */
export function isLate(checkInTime: Date): boolean {
  const deadline = SCHEDULE_CONFIG.check_in_deadline;
  const [h, m] = deadline.split(":").map(Number);
  const deadlineMin = h * 60 + m;
  const checkInMin = checkInTime.getHours() * 60 + checkInTime.getMinutes();
  return checkInMin > deadlineMin;
}

/**
 * Calculate work duration in minutes between check-in and check-out.
 */
export function calcWorkMinutes(checkIn: Date, checkOut: Date): number {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / 60000);
}

/**
 * Format minutes as "Xh Ym".
 */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} د`;
  if (m === 0) return `${h} س`;
  return `${h} س ${m} د`;
}
