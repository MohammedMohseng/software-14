import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const album = await db.album.findUnique({ where: { id } });
    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const photos = await db.photo.findMany({
      where: { albumId: id },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ photos, album });
  } catch (error) {
    console.error("Get photos error:", error);
    return NextResponse.json(
      { error: "Failed to fetch photos" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, url, caption } = body;

    if (!userId || !url) {
      return NextResponse.json(
        { error: "userId and url are required" },
        { status: 400 }
      );
    }

    const album = await db.album.findUnique({ where: { id } });
    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    const photo = await db.photo.create({
      data: {
        albumId: id,
        userId,
        url,
        caption: caption || null,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json({ photo }, { status: 201 });
  } catch (error) {
    console.error("Create photo error:", error);
    return NextResponse.json(
      { error: "Failed to create photo" },
      { status: 500 }
    );
  }
}
