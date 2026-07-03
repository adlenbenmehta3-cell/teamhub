/**
 * Pre-seed the admin account (Adlene) directly into the template database.
 * This ensures the admin always exists on every Vercel cold start.
 *
 * Usage: node scripts/seed-admin-template.js
 */

const crypto = require("crypto");
const { PrismaClient } = require("@prisma/client");

async function main() {
  // Point to the template DB
  process.env.DATABASE_URL =
    "file:/home/z/my-project/db/teamhub-empty.db";

  const prisma = new PrismaClient();

  const password = "adlene123"; // The password for Adlene
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .createHash("sha256")
    .update(`${salt}:${password}`)
    .digest("hex");
  const storedPassword = `${salt}:${hash}`;

  // Delete existing admin if any
  await prisma.user
    .deleteMany({ where: { email: "admin@team.com" } })
    .catch(() => {});

  // Create the admin account
  const admin = await prisma.user.create({
    data: {
      name: "Adlene",
      email: "admin@team.com",
      password: storedPassword,
      role: "TEAM_LEADER",
      department: "GENERAL",
      title: "Administrator",
    },
  });

  // Create a welcome announcement
  await prisma.announcement
    .create({
      data: {
        title: "مرحبًا بك Adlene | Welcome Adlene",
        content:
          "تم إعداد حساب الأدمن بنجاح.\n" +
          "Admin account has been set up successfully.\n\n" +
          "الخطوات التالية | Next steps:\n" +
          "1. أضف أعضاء فريقك من 'إدارة الفريق' | Add team members from 'Team Management'\n" +
          "2. أنشئ المهام ووزعها | Create and assign tasks\n" +
          "3. شارك الإعلانات مع الفريق | Share announcements",
        pinned: true,
        creatorId: admin.id,
      },
    })
    .catch(() => {});

  // Verify
  const count = await prisma.user.count();
  console.log("✓ Admin pre-seeded into template DB");
  console.log("  Email: admin@team.com");
  console.log("  Password:", password);
  console.log("  Total users in template:", count);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
