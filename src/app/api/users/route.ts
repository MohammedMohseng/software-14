import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requesterId = searchParams.get("requesterId");

    // Admin only
    if (requesterId) {
      const requester = await db.user.findUnique({ where: { id: requesterId } });
      if (!requester || (requester.role !== "admin" && requester.role !== "moderator")) {
        return NextResponse.json(
          { error: "Admin or moderator access required" },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "requesterId is required" },
        { status: 400 }
      );
    }

    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            memories: true,
            photos: true,
            discussions: true,
            gameScores: true,
            comments: true,
          },
        },
      },
    });

    const formatted = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      avatar: u.avatar,
      points: u.points,
      bio: u.bio,
      createdAt: u.createdAt,
      activity: {
        memories: u._count.memories,
        photos: u._count.photos,
        discussions: u._count.discussions,
        gameScores: u._count.gameScores,
        comments: u._count.comments,
      },
    }));

    // Role distribution
    const roleDistribution: Record<string, number> = {};
    for (const u of formatted) {
      roleDistribution[u.role] = (roleDistribution[u.role] || 0) + 1;
    }

    return NextResponse.json({
      users: formatted,
      total: formatted.length,
      roleDistribution,
    });
  } catch (error) {
    console.error("Get users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
