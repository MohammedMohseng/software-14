import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { db } from "@/lib/db";

export async function POST() {
  try {
    // Clean existing data
    await db.report.deleteMany();
    await db.vote.deleteMany();
    await db.honorEntry.deleteMany();
    await db.gameScore.deleteMany();
    await db.comment.deleteMany();
    await db.discussion.deleteMany();
    await db.newsEvent.deleteMany();
    await db.resource.deleteMany();
    await db.photo.deleteMany();
    await db.album.deleteMany();
    await db.memory.deleteMany();
    await db.themeConfig.deleteMany();
    await db.siteSetting.deleteMany();
    await db.auditLog.deleteMany();
    await db.user.deleteMany();

    // Hash passwords
    const adminPassword = await hash("admin123", 12);
    const modPassword = await hash("mod123", 12);
    const profPassword = await hash("prof123", 12);

    // Create 3 core accounts
    const admin = await db.user.create({
      data: {
        name: "مدير النظام",
        email: "admin@software14.edu",
        password: adminPassword,
        role: "admin",
        avatar: null,
        points: 0,
        bio: "مدير المنصة ومنسق الدفعة",
        provider: "credentials",
      },
    });

    const moderator = await db.user.create({
      data: {
        name: "المشرف",
        email: "mod@software14.edu",
        password: modPassword,
        role: "moderator",
        avatar: null,
        points: 0,
        bio: "مشرف المجتمع، يحافظ على النظام",
        provider: "credentials",
      },
    });

    const professor = await db.user.create({
      data: {
        name: "الأستاذ",
        email: "prof@software14.edu",
        password: profPassword,
        role: "professor",
        avatar: null,
        points: 0,
        bio: "أستاذ هندسة البرمجيات",
        provider: "credentials",
      },
    });

    // Create welcome announcement
    await db.newsEvent.create({
      data: {
        authorId: admin.id,
        title: "مرحبًا بكم في منصة Software-14!",
        content: "يسعدنا إطلاق منصة مجتمعنا. هنا يمكنك مشاركة الذكريات، الوصول إلى المصادر، لعب الألعاب، والتواصل مع زملاء الدفعة. استكشف جميع الميزات واجعلها خاصتك!",
        category: "announcement",
        pinned: true,
      },
    });

    // Seed default theme config
    await db.themeConfig.createMany({
      data: [
        { key: "active-theme", value: "default" },
        { key: "theme-primary-light", value: "#10b981" },
        { key: "theme-primary-dark", value: "#34d399" },
        { key: "theme-accent-light", value: "#14b8a6" },
        { key: "theme-accent-dark", value: "#2dd4bf" },
      ],
    });


    return NextResponse.json({
      success: true,
      message: "تم تهيئة قاعدة البيانات بنجاح",
      accounts: [
        { role: "مدير", email: "admin@software14.edu", password: "admin123" },
        { role: "مشرف", email: "mod@software14.edu", password: "mod123" },
        { role: "أستاذ", email: "prof@software14.edu", password: "prof123" },
      ],
    });
    
  } catch (error) {
if (!error){        console.error("no Seed error");}else { 
console.error("Seed error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to seed database", error: String(error) },
      { status: 500 }
    );}
  }
}

export async function GET() {
  try {
    const userCount = await db.user.count();

    if (userCount === 0) {
      return NextResponse.json({ seeded: false });
    }

    const adminUser = await db.user.findFirst({
      where: { role: "admin" },
    });

    return NextResponse.json({
      seeded: true,
      totalUsers: userCount,
      defaultUser: adminUser
        ? {
            id: adminUser.id,
            name: adminUser.name,
            email: adminUser.email,
            role: adminUser.role,
          }
        : null,
    });
  } catch (error) {
    console.error("Check seed error:", error);
    return NextResponse.json(
      { seeded: false, error: String(error) },
      { status: 500 }
    );
  }
}
