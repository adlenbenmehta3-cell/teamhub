import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPasswordForStorage } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

/**
 * Ensure database schema exists by pushing it.
 * On Vercel serverless, the /tmp/teamhub.db file may not exist on cold start.
 */
async function ensureSchema() {
  try {
    // Try to query — if it fails, schema needs to be created
    await db.user.count();
  } catch (e) {
    // Schema doesn't exist. We need to push it.
    // Since we can't run prisma CLI in serverless, we use a different approach:
    // The prisma db push should run during build, creating the schema.
    // For runtime, we rely on the schema being created.
    throw e;
  }
}

/**
 * POST /api/seed
 * Initializes the database with demo data: 1 team leader + 5 members.
 * Only works if the database is empty.
 */
export async function POST() {
  try {
    let userCount = 0;
    try {
      userCount = await db.user.count();
    } catch (e) {
      // Database doesn't exist yet — schema needs to be pushed
      console.error("DB query failed, schema may not exist:", e);
      return NextResponse.json(
        {
          error:
            "Database not initialized. Please ensure prisma db push runs during build.",
        },
        { status: 500 }
      );
    }

    if (userCount > 0) {
      return NextResponse.json(
        { error: "قاعدة البيانات تحتوي بالفعل على مستخدمين. استخدم تسجيل الدخول." },
        { status: 400 }
      );
    }

    // Create team leader
    const tlPassword = await hashPasswordForStorage("leader123");
    const teamLeader = await db.user.create({
      data: {
        name: "أحمد قائد الفريق",
        email: "leader@team.com",
        password: tlPassword,
        role: "TEAM_LEADER",
        department: "GENERAL",
        title: "مدير التسويق",
      },
    });

    // Create 5 members
    const members = [
      {
        name: "فاطمة العلي",
        email: "fatima@team.com",
        role: "SENIOR_MARKETER",
        department: "SOCIAL_MEDIA",
        title: "مديرة حسابات التواصل",
      },
      {
        name: "خالد المنصور",
        email: "khaled@team.com",
        role: "MARKETING_SPECIALIST",
        department: "CONTENT_CREATION",
        title: "كاتب محتوى",
      },
      {
        name: "نورة السالم",
        email: "noura@team.com",
        role: "MARKETING_SPECIALIST",
        department: "SEO_ANALYTICS",
        title: "محللة بيانات",
      },
      {
        name: "يوسف الحمد",
        email: "yousef@team.com",
        role: "JUNIOR_MARKETER",
        department: "PAID_ADS",
        title: "متخصص إعلانات مبتدئ",
      },
      {
        name: "سارة الإبراهيم",
        email: "sara@team.com",
        role: "JUNIOR_MARKETER",
        department: "EMAIL_MARKETING",
        title: "متخصصة بريد إلكتروني",
      },
    ];

    const createdMembers = [];
    for (const m of members) {
      const pwd = await hashPasswordForStorage("member123");
      const created = await db.user.create({
        data: { ...m, password: pwd },
      });
      createdMembers.push(created);

      // Give them some initial points
      const initialPoints = Math.floor(Math.random() * 30) + 10;
      await db.user.update({
        where: { id: created.id },
        data: {
          totalPoints: initialPoints,
          weeklyPoints: initialPoints,
          monthlyPoints: initialPoints,
        },
      });
    }

    // Create some sample tasks
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    await db.task.createMany({
      data: [
        {
          title: "إعداد تقرير حملة السوشيال ميديا الأسبوعي",
          description:
            "تجميع وتحليل أداء منصات التواصل الاجتماعي للأسبوع الماضي، مع تقديم توصيات للأسبوع القادم.",
          deadline: tomorrow,
          priority: "HIGH",
          status: "OPEN",
          assigneeId: createdMembers[0].id,
          creatorId: teamLeader.id,
        },
        {
          title: "كتابة 3 مقالات للمدونة",
          description:
            "كتابة 3 مقالات حول مواضيع التسويق الرقمي، كل مقال 800-1000 كلمة.",
          deadline: nextWeek,
          priority: "MEDIUM",
          status: "OPEN",
          assigneeId: createdMembers[1].id,
          creatorId: teamLeader.id,
        },
        {
          title: "تحليل بيانات الزوار للموقع",
          description:
            "استخراج تقرير تفصيلي عن مصادر الزيارات وسلوك المستخدمين على الموقع.",
          deadline: tomorrow,
          priority: "URGENT",
          status: "OPEN",
          assigneeId: createdMembers[2].id,
          creatorId: teamLeader.id,
        },
        {
          title: "إعداد حملة إعلانية جديدة على فيسبوك",
          description:
            "تصميم وإطلاق حملة إعلانية جديدة على منصة فيسبوك بميزانية 5000 درهم.",
          deadline: nextWeek,
          priority: "MEDIUM",
          status: "OPEN",
          assigneeId: createdMembers[3].id,
          creatorId: teamLeader.id,
        },
        {
          title: "إرسال النشرة البريدية الأسبوعية",
          description: "إعداد وإرسال النشرة الأسبوعية للمشتركين (حوالي 5000 مشترك).",
          deadline: tomorrow,
          priority: "HIGH",
          status: "OPEN",
          assigneeId: createdMembers[4].id,
          creatorId: teamLeader.id,
        },
      ],
    });

    // Create a welcome announcement
    await db.announcement.create({
      data: {
        title: "مرحبًا بكم في TeamHub!",
        content:
          "أهلاً وسهلاً بجميع أعضاء الفريق في منصة إدارة الفريق الجديدة. " +
          "هذه المنصة ستساعدنا على تنظيم عملنا اليومي، تتبع المهام، " +
          "تسجيل الحضور والانصراف، ومتابعة الأداء.\n\n" +
          "الخطوات الأولى:\n" +
          "1. سجّل حضورك كل صباح من صفحة 'الحضور'\n" +
          "2. تحقق من مهامك في صفحة 'المهام'\n" +
          "3. قدّم تقريرك اليومي قبل نهاية اليوم من صفحة 'التقارير'\n" +
          "4. شارك في الاجتماعات وسجّل حضورك\n\n" +
          "بالتوفيق للجميع!",
        pinned: true,
        creatorId: teamLeader.id,
      },
    });

    // Schedule a weekly meeting
    const friday = new Date();
    const daysUntilFriday = (5 - friday.getDay() + 7) % 7 || 7;
    friday.setDate(friday.getDate() + daysUntilFriday);
    friday.setHours(14, 0, 0, 0);

    await db.meeting.create({
      data: {
        title: "اجتماع الفريق الأسبوعي",
        description: "مراجعة إنجازات الأسبوع ومناقشة خطط الأسبوع القادم.",
        datetime: friday,
        durationMin: 45,
        type: "WEEKLY",
        agenda:
          "1. مراجعة مهام الأسبوع المنتهي\n2. مناقشة الأولويات للأسبوع القادم\n3. حل المشكلات والمعوقات\n4. توزيع المهام الجديدة",
        creatorId: teamLeader.id,
      },
    });

    // Add a sample KB entry
    await db.kBEntry.create({
      data: {
        title: "دليل إنشاء حملة على فيسبوك إعلانات",
        url: "https://example.com/facebook-ads-guide",
        category: "PLAYBOOK",
        summary: "دليل شامل لإنشاء وتحسين الحملات الإعلانية على منصة فيسبوك.",
        tags: "facebook,ads,paid",
        creatorId: teamLeader.id,
      },
    });

    await db.kBEntry.create({
      data: {
        title: "قالب التقرير الأسبوعي للتسويق",
        url: "https://example.com/weekly-report-template",
        category: "TEMPLATE",
        summary:
          "قالب جاهز للتقارير الأسبوعية يتضمن KPIs والإنجازات والخطوات القادمة.",
        tags: "template,report,weekly",
        creatorId: teamLeader.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: "تم إنشاء البيانات التجريبية بنجاح",
      credentials: {
        teamLeader: { email: "leader@team.com", password: "leader123" },
        members: { email: "[name]@team.com", password: "member123" },
      },
    });
  } catch (e) {
    console.error("Seed error:", e);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إنشاء البيانات التجريبية" },
      { status: 500 }
    );
  }
}
