import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, requesterId } = body;

    const validStatuses = ["resolved", "dismissed"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'resolved' or 'dismissed'" },
        { status: 400 }
      );
    }

    // Admin/moderator only
    if (!requesterId) {
      return NextResponse.json(
        { error: "requesterId is required" },
        { status: 400 }
      );
    }

    const requester = await db.user.findUnique({ where: { id: requesterId } });
    if (!requester || !["admin", "moderator"].includes(requester.role)) {
      return NextResponse.json(
        { error: "Admin or moderator access required" },
        { status: 403 }
      );
    }

    const report = await db.report.findUnique({ where: { id } });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.status !== "pending") {
      return NextResponse.json(
        { error: "Report has already been " + report.status },
        { status: 400 }
      );
    }

    const updated = await db.report.update({
      where: { id },
      data: { status },
      include: {
        reporter: { select: { id: true, name: true, avatar: true } },
        reported: { select: { id: true, name: true, avatar: true } },
      },
    });

    // If resolved and it's content, optionally delete the reported content (admin only)
    if (status === "resolved" && requester.role === "admin") {
      try {
        if (report.targetType === "memory") {
          await db.memory.deleteMany({ where: { id: report.targetId } });
        } else if (report.targetType === "photo") {
          await db.photo.deleteMany({ where: { id: report.targetId } });
        } else if (report.targetType === "discussion") {
          await db.discussion.deleteMany({ where: { id: report.targetId } });
        } else if (report.targetType === "comment") {
          await db.comment.deleteMany({ where: { id: report.targetId } });
        }
      } catch {
        // Content may already be deleted, ignore
      }
    }

    return NextResponse.json({ report: updated });
  } catch (error) {
    console.error("Update report error:", error);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}
