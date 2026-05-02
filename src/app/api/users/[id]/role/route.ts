import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { role, requesterId } = body;

    const validRoles = ["admin", "moderator", "professor", "student", "visitor"];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be one of: " + validRoles.join(", ") },
        { status: 400 }
      );
    }

    // Verify admin
    if (!requesterId) {
      return NextResponse.json(
        { error: "requesterId is required" },
        { status: 400 }
      );
    }

    const requester = await db.user.findUnique({ where: { id: requesterId } });
    if (!requester || (requester.role !== "admin" && requester.role !== "moderator")) {
      return NextResponse.json(
        { error: "Only admins or moderators can change user roles" },
        { status: 403 }
      );
    }

    // Moderators cannot assign admin or moderator roles
    if (requester.role === "moderator" && (role === "admin" || role === "moderator")) {
      return NextResponse.json(
        { error: "Moderators cannot assign admin or moderator roles" },
        { status: 403 }
      );
    }

    // Prevent self-demotion
    if (id === requesterId && role !== "admin") {
      return NextResponse.json(
        { error: "You cannot demote yourself" },
        { status: 400 }
      );
    }

    const targetUser = await db.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        points: true,
        bio: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Update role error:", error);
    return NextResponse.json(
      { error: "Failed to update user role" },
      { status: 500 }
    );
  }
}
