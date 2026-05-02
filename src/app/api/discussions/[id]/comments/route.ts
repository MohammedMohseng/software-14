import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface CommentWithUser {
  id: string;
  discussionId: string;
  userId: string;
  content: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; name: string; avatar: string | null; role: string };
  replies?: CommentWithUser[];
}

function buildCommentTree(
  comments: CommentWithUser[]
): CommentWithUser[] {
  const map = new Map<string, CommentWithUser>();
  const roots: CommentWithUser[] = [];

  for (const comment of comments) {
    map.set(comment.id, { ...comment, replies: [] });
  }

  for (const comment of comments) {
    const node = map.get(comment.id)!;
    if (comment.parentId && map.has(comment.parentId)) {
      map.get(comment.parentId)!.replies!.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const discussion = await db.discussion.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });
    if (!discussion) {
      return NextResponse.json(
        { error: "Discussion not found" },
        { status: 404 }
      );
    }

    const allComments = await db.comment.findMany({
      where: { discussionId: id },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    const threadedComments = buildCommentTree(
      allComments as unknown as CommentWithUser[]
    );

    return NextResponse.json({ comments: threadedComments, discussion });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
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
    const { userId, content, parentId } = body;

    if (!userId || !content) {
      return NextResponse.json(
        { error: "userId and content are required" },
        { status: 400 }
      );
    }

    const discussion = await db.discussion.findUnique({ where: { id } });
    if (!discussion) {
      return NextResponse.json(
        { error: "Discussion not found" },
        { status: 404 }
      );
    }

    if (parentId) {
      const parentComment = await db.comment.findUnique({
        where: { id: parentId },
      });
      if (!parentComment || parentComment.discussionId !== id) {
        return NextResponse.json(
          { error: "Parent comment not found in this discussion" },
          { status: 400 }
        );
      }
    }

    const comment = await db.comment.create({
      data: {
        discussionId: id,
        userId,
        content,
        parentId: parentId || null,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true, role: true } },
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
