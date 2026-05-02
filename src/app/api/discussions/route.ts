import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const discussions = await db.discussion.findMany({
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
        _count: { select: { comments: true } },
      },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ discussions });
  } catch (error) {
    console.error("Get discussions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch discussions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, content } = body;

    if (!userId || !title || !content) {
      return NextResponse.json(
        { error: "userId, title, and content are required" },
        { status: 400 }
      );
    }

    const discussion = await db.discussion.create({
      data: { userId, title, content },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
        _count: { select: { comments: true } },
      },
    });

    return NextResponse.json({ discussion }, { status: 201 });
  } catch (error) {
    console.error("Create discussion error:", error);
    return NextResponse.json(
      { error: "Failed to create discussion" },
      { status: 500 }
    );
  }
}
