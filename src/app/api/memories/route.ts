import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const memories = await db.memory.findMany({
      include: {
        user: {
          select: { id: true, name: true, avatar: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ memories });
  } catch (error) {
    console.error("Get memories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch memories" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, text, imageUrl } = body;

    if (!userId || !text) {
      return NextResponse.json(
        { error: "userId and text are required" },
        { status: 400 }
      );
    }

    // Check word count (max 1000 words)
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount > 1000) {
      return NextResponse.json(
        { error: "Text must be 1000 words or less" },
        { status: 400 }
      );
    }

    const memory = await db.memory.create({
      data: {
        userId,
        text,
        imageUrl: imageUrl || null,
      },
      include: {
        user: {
          select: { id: true, name: true, avatar: true, role: true },
        },
      },
    });

    return NextResponse.json({ memory }, { status: 201 });
  } catch (error) {
    console.error("Create memory error:", error);
    return NextResponse.json(
      { error: "Failed to create memory" },
      { status: 500 }
    );
  }
}
