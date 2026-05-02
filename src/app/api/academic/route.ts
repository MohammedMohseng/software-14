import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const resources = await db.resource.findMany({
      include: {
        professor: {
          select: { id: true, name: true, avatar: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ resources });
  } catch (error) {
    console.error("Get academic resources error:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}
