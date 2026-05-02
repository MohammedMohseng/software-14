import { NextRequest, NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { db } from "@/lib/db";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, bio, avatar, currentPassword, newPassword, requesterId } = body;

    // Verify requester
    if (!requesterId) {
      return NextResponse.json(
        { error: "requesterId is required" },
        { status: 400 }
      );
    }

    const requester = await db.user.findUnique({ where: { id: requesterId } });
    if (!requester) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Can only edit own profile (unless admin/moderator)
    if (requesterId !== id && requester.role !== "admin" && requester.role !== "moderator") {
      return NextResponse.json(
        { error: "Not authorized to edit this profile" },
        { status: 403 }
      );
    }

    const targetUser = await db.user.findUnique({ where: { id } });
    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (name !== undefined && name.trim()) {
      updateData.name = name.trim();
    }
    if (bio !== undefined) {
      updateData.bio = bio.trim() || null;
    }
    if (avatar !== undefined) {
      updateData.avatar = avatar || null;
    }

    // Handle password change
    if (currentPassword && newPassword) {
      // Must be editing own profile
      if (requesterId !== id) {
        return NextResponse.json(
          { error: "Cannot change another user's password" },
          { status: 403 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل" },
          { status: 400 }
        );
      }

      // Verify current password
      if (targetUser.password) {
        const isValid = await compare(currentPassword, targetUser.password);
        if (!isValid) {
          return NextResponse.json(
            { error: "كلمة المرور الحالية غير صحيحة" },
            { status: 400 }
          );
        }
      }

      updateData.password = await hash(newPassword, 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar,
        points: updatedUser.points,
        bio: updatedUser.bio,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
