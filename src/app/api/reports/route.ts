import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const requesterId = searchParams.get("requesterId");

    // Admin/moderator only
    if (requesterId) {
      const requester = await db.user.findUnique({ where: { id: requesterId } });
      if (!requester || !["admin", "moderator"].includes(requester.role)) {
        return NextResponse.json(
          { error: "Admin or moderator access required" },
          { status: 403 }
        );
      }
    }

    const where = status ? { status } : {};

    const reports = await db.report.findMany({
      where,
      include: {
        reporter: { select: { id: true, name: true, avatar: true, role: true } },
        reported: { select: { id: true, name: true, avatar: true, role: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    });

    // Pending first
    const sorted = reports.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return 0;
    });

    return NextResponse.json({
      reports: sorted,
      total: sorted.length,
      pending: sorted.filter((r) => r.status === "pending").length,
      resolved: sorted.filter((r) => r.status === "resolved").length,
      dismissed: sorted.filter((r) => r.status === "dismissed").length,
    });
  } catch (error) {
    console.error("Get reports error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, targetType, targetId, reason } = body;

    if (!userId || !targetType || !targetId || !reason) {
      return NextResponse.json(
        { error: "userId, targetType, targetId, and reason are required" },
        { status: 400 }
      );
    }

    const validTargetTypes = ["memory", "photo", "user", "discussion", "comment"];
    if (!validTargetTypes.includes(targetType)) {
      return NextResponse.json(
        { error: "Invalid targetType. Must be one of: " + validTargetTypes.join(", ") },
        { status: 400 }
      );
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Don't allow reporting self
    if (targetType === "user" && targetId === userId) {
      return NextResponse.json(
        { error: "You cannot report yourself" },
        { status: 400 }
      );
    }

    // Check for duplicate pending report
    const existing = await db.report.findFirst({
      where: {
        reporterId: userId,
        targetType,
        targetId,
        status: "pending",
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already reported this item" },
        { status: 409 }
      );
    }

    // Find the owner of the reported content
    let reportedId: string | null = null;
    if (targetType === "user") {
      reportedId = targetId;
    } else if (targetType === "memory") {
      const memory = await db.memory.findUnique({ where: { id: targetId } });
      reportedId = memory?.userId || null;
    } else if (targetType === "photo") {
      const photo = await db.photo.findUnique({ where: { id: targetId } });
      reportedId = photo?.userId || null;
    } else if (targetType === "discussion") {
      const discussion = await db.discussion.findUnique({ where: { id: targetId } });
      reportedId = discussion?.userId || null;
    } else if (targetType === "comment") {
      const comment = await db.comment.findUnique({ where: { id: targetId } });
      reportedId = comment?.userId || null;
    }

    const report = await db.report.create({
      data: {
        reporterId: userId,
        reportedId: reportedId || "unknown",
        targetType,
        targetId,
        reason,
      },
      include: {
        reporter: { select: { id: true, name: true, avatar: true } },
        reported: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("Create report error:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}
