import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Academic honor: student with most discussion activity (comments + discussions)
    const academicTop = await db.user.findMany({
      where: { role: "student" },
      include: {
        discussions: { select: { id: true } },
        comments: { select: { id: true } },
      },
      orderBy: { points: "desc" },
      take: 10,
    });

    const academicRanked = academicTop
      .map((u) => ({
        id: u.id,
        name: u.name,
        avatar: u.avatar,
        points: u.points,
        activity: u.discussions.length + u.comments.length,
      }))
      .sort((a, b) => b.activity - a.activity);

    // Gaming honor: student with highest game score
    const gamingScores = await db.gameScore.groupBy({
      by: ["userId"],
      _max: { score: true },
      _sum: { score: true },
      orderBy: { _sum: { score: "desc" } },
      take: 10,
    });

    const gamingRanked = await Promise.all(
      gamingScores.map(async (gs) => {
        const user = await db.user.findUnique({
          where: { id: gs.userId },
          select: { id: true, name: true, avatar: true, points: true },
        });
        return {
          id: gs.userId,
          name: user?.name || "Unknown",
          avatar: user?.avatar || null,
          points: user?.points || 0,
          topScore: gs._max.score || 0,
          totalScore: gs._sum.score || 0,
        };
      })
    );

    // Voting honor: student with most votes received
    const voteCounts = await db.vote.groupBy({
      by: ["candidateId"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    });

    const votingRanked = await Promise.all(
      voteCounts.map(async (vc) => {
        const user = await db.user.findUnique({
          where: { id: vc.candidateId },
          select: { id: true, name: true, avatar: true, points: true },
        });
        return {
          id: vc.candidateId,
          name: user?.name || "Unknown",
          avatar: user?.avatar || null,
          points: user?.points || 0,
          votesReceived: vc._count.id,
        };
      })
    );

    // If no data exists for a category, use top students by points as fallback
    const allStudents = await db.user.findMany({
      where: { role: "student" },
      orderBy: { points: "desc" },
      take: 3,
      select: { id: true, name: true, avatar: true, points: true },
    });

    const academic = academicRanked.length > 0 ? academicRanked.slice(0, 3) : allStudents.map((s) => ({ ...s, activity: 0 }));
    const gaming = gamingRanked.length > 0 ? gamingRanked.slice(0, 3) : allStudents.map((s) => ({ ...s, topScore: 0, totalScore: 0 }));
    const voting = votingRanked.length > 0 ? votingRanked.slice(0, 3) : allStudents.map((s) => ({ ...s, votesReceived: 0 }));

    return NextResponse.json({
      academic,
      gaming,
      voting,
    });
  } catch (error) {
    console.error("Get honor roll error:", error);
    return NextResponse.json(
      { error: "Failed to fetch honor roll" },
      { status: 500 }
    );
  }
}
