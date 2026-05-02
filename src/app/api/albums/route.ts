import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const albums = await db.album.findMany({
      include: {
        _count: { select: { photos: true } },
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ albums });
  } catch (error) {
    console.error("Get albums error:", error);
    return NextResponse.json(
      { error: "Failed to fetch albums" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, userId } = body;

    if (!title || !userId) {
      return NextResponse.json(
        { error: "title and userId are required" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const allowedRoles = ["admin", "moderator"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { error: "Only moderators and admins can create albums" },
        { status: 403 }
      );
    }

    const album = await db.album.create({
      data: { title, createdBy: userId },
      include: {
        _count: { select: { photos: true } },
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json({ album }, { status: 201 });
  } catch (error) {
    console.error("Create album error:", error);
    return NextResponse.json(
      { error: "Failed to create album" },
      { status: 500 }
    );
  }
}
