import type { Metadata } from "next";
import { Cairo, Tajawal, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { LanguageProvider } from "@/components/language-provider";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "TeamHub — Marketing Team Management",
  description:
    "Complete platform for managing marketing teams: attendance, tasks, daily reports, meetings, and performance tracking.",
  keywords: ["team management", "marketing", "attendance", "tasks", "reports", "performance"],
  authors: [{ name: "TeamHub" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${tajawal.variable} ${inter.variable} antialiased bg-background text-foreground font-tajawal`}
      >
        <LanguageProvider>
          {children}
          <Toaster />
          <SonnerToaster position="top-center" richColors />
        </LanguageProvider>
      </body>
    </html>
  );
}
