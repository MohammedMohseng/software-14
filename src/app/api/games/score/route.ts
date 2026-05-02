import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { userId, game, score } = await req.json();

    if (!userId || !game || typeof score !== "number") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Save game score
    const gameScore = await db.gameScore.create({
      data: {
        userId,
        game,
        score,
      },
    });

    // Update user points (add the score to their total)
    const user = await db.user.findUnique({ where: { id: userId } });
    if (user) {
      await db.user.update({
        where: { id: userId },
        data: { points: user.points + score },
      });
    }

    return NextResponse.json({
      success: true,
      gameScore: {
        id: gameScore.id,
        game: gameScore.game,
        score: gameScore.score,
        createdAt: gameScore.createdAt,
      },
    });
  } catch (error) {
    console.error("Score API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const game = searchParams.get("game");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const where = game ? { game } : {};

    const scores = await db.gameScore.findMany({
      where,
      orderBy: { score: "desc" },
      take: limit,
      include: {
        user: {
          select: { name: true, avatar: true },
        },
      },
    });

    return NextResponse.json({
      scores: scores.map((s) => ({
        id: s.id,
        game: s.game,
        score: s.score,
        userName: s.user.name,
        userAvatar: s.user.avatar,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error("Score GET API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
