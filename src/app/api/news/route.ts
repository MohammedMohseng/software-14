import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const where = category && category !== "all" ? { category } : {};

    const news = await db.newsEvent.findMany({
      where,
      include: {
        author: { select: { id: true, name: true, avatar: true, role: true } },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ news });
  } catch (error) {
    console.error("Get news error:", error);
    return NextResponse.json(
      { error: "Failed to fetch news" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { authorId, title, content, category } = body;

    if (!authorId || !title || !content) {
      return NextResponse.json(
        { error: "authorId, title, and content are required" },
        { status: 400 }
      );
    }

    // Check role - moderator/professor+ only
    const user = await db.user.findUnique({ where: { id: authorId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const allowedRoles = ["admin", "moderator", "professor"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Only moderators, professors, and admins can create news" },
        { status: 403 }
      );
    }

    const newsEvent = await db.newsEvent.create({
      data: {
        authorId,
        title,
        content,
        category: category || "general",
      },
      include: {
        author: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    return NextResponse.json({ newsEvent }, { status: 201 });
  } catch (error) {
    console.error("Create news error:", error);
    return NextResponse.json(
      { error: "Failed to create news event" },
      { status: 500 }
    );
  }
}
