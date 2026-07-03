/**
 * Authentication utilities for Innov8 Brands.
 * Simple session-based auth with HTTP-only cookies.
 * Passwords are hashed with Web Crypto API (SHA-256 + salt).
 */

import { cookies } from "next/headers";
import { db } from "./db";
import { randomBytes } from "crypto";

// ============================================================
// Password Hashing (SHA-256 with salt)
// ============================================================

const encoder = new TextEncoder();

async function hashPassword(password: string, salt: string): Promise<string> {
  const data = encoder.encode(`${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function verifyPassword(
  password: string,
  salt: string,
  storedHash: string
): Promise<boolean> {
  const hash = await hashPassword(password, salt);
  return hash === storedHash;
}

export async function createPasswordHash(password: string): Promise<{
  salt: string;
  hash: string;
}> {
  const salt = randomBytes(16).toString("hex");
  const hash = await hashPassword(password, salt);
  return { salt, hash };
}

// Store salt:hash format in the password field
export async function hashPasswordForStorage(password: string): Promise<string> {
  const { salt, hash } = await createPasswordHash(password);
  return `${salt}:${hash}`;
}

export async function verifyStoredPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  return verifyPassword(password, salt, hash);
}

// ============================================================
// Session Management
// ============================================================

const SESSION_COOKIE = "teamhub_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}

export async function getSession(token: string | undefined) {
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;

  // Check expiration
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await getSession(token);
  return session?.user ?? null;
}

export async function destroySession(token: string): Promise<void> {
  await db.session.deleteMany({ where: { token } }).catch(() => {});
}

export const SESSION_COOKIE_NAME = SESSION_COOKIE;
export const SESSION_DURATION = SESSION_DURATION_MS;

// ============================================================
// Authorization Helpers
// ============================================================

export function isTeamLeader(role: string): boolean {
  return role === "TEAM_LEADER";
}

export function isSeniorOrAbove(role: string): boolean {
  return role === "TEAM_LEADER" || role === "SENIOR_MARKETER";
}

export function canManageTasks(role: string): boolean {
  return isTeamLeader(role);
}

export function canManageTeam(role: string): boolean {
  return isTeamLeader(role);
}

export function canManageKB(role: string): boolean {
  return isSeniorOrAbove(role);
}

export function canManageMeetings(role: string): boolean {
  return isTeamLeader(role);
}

// ============================================================
// Role Labels (Arabic)
// ============================================================

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
