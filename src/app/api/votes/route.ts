import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function getCurrentWeek(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 604800000;
  return Math.ceil(diff / oneWeek);
}

export async function GET() {
  try {
    const week = getCurrentWeek();

    const categories = ["academic", "gaming", "general"];

    const standings: Record<string, Array<{ candidateId: string; candidateName: string; candidateAvatar: string | null; votes: number }>> = {};

    for (const category of categories) {
      const votes = await db.vote.findMany({
        where: { category, week },
        include: {
          candidate: { select: { id: true, name: true, avatar: true } },
        },
      });

      // Aggregate votes per candidate
      const aggregated: Record<string, { candidateId: string; candidateName: string; candidateAvatar: string | null; votes: number }> = {};
      for (const vote of votes) {
        const cid = vote.candidateId;
        if (!aggregated[cid]) {
          aggregated[cid] = {
            candidateId: cid,
            candidateName: vote.candidate.name,
            candidateAvatar: vote.candidate.avatar,
            votes: 0,
          };
        }
        aggregated[cid].votes++;
      }

      standings[category] = Object.values(aggregated).sort((a, b) => b.votes - a.votes);
    }

    return NextResponse.json({
      week,
      standings,
    });
  } catch (error) {
    console.error("Get votes error:", error);
    return NextResponse.json(
      { error: "Failed to fetch vote standings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { voterId, candidateId, category } = body;

    if (!voterId || !candidateId || !category) {
      return NextResponse.json(
        { error: "voterId, candidateId, and category are required" },
        { status: 400 }
      );
    }

    const validCategories = ["academic", "gaming", "general"];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category. Must be: academic, gaming, or general" },
        { status: 400 }
      );
    }

    // Verify voter
    const voter = await db.user.findUnique({ where: { id: voterId } });
    if (!voter) {
      return NextResponse.json({ error: "Voter not found" }, { status: 404 });
    }

    // Verify candidate
    const candidate = await db.user.findUnique({ where: { id: candidateId } });
    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    // Can't vote for yourself
    if (voterId === candidateId) {
      return NextResponse.json(
        { error: "You cannot vote for yourself" },
        { status: 400 }
      );
    }

    const week = getCurrentWeek();

    // Check if already voted this week in this category
    const existing = await db.vote.findUnique({
      where: {
        voterId_category_week: {
          voterId,
          category,
          week,
        },
      },
    });

    if (existing) {
      // Update the vote
      const updated = await db.vote.update({
        where: { id: existing.id },
        data: { candidateId },
        include: {
          candidate: { select: { id: true, name: true, avatar: true } },
        },
      });

      return NextResponse.json({ vote: updated, changed: true });
    }

    const vote = await db.vote.create({
      data: {
        voterId,
        candidateId,
        category,
        week,
      },
      include: {
        candidate: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json({ vote }, { status: 201 });
  } catch (error) {
    console.error("Create vote error:", error);
    return NextResponse.json(
      { error: "Failed to cast vote" },
      { status: 500 }
    );
  }
}
