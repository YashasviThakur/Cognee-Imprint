import { NextRequest, NextResponse } from "next/server";
import { updateMemory, deleteMemory, Topic } from "@/lib/dynamodb";
import { resolveUserId, unauthorized } from "@/lib/authz";

interface Params {
  params: Promise<{ id: string }>;
}

// PATCH /api/memories/[id]
export async function PATCH(req: NextRequest, { params }: Params) {
  const { id: memoryId } = await params;
  const body = await req.json();
  const userId = await resolveUserId(req, body.userId);
  if (!userId) return unauthorized();
  const { createdAt, content, pinned, topic, tags, contradicts, conflictReasons } = body;

  if (!createdAt) {
    return NextResponse.json(
      { error: "userId and createdAt required" },
      { status: 400 }
    );
  }

  try {
    await updateMemory(userId, memoryId, createdAt, {
      ...(content !== undefined && { content }),
      ...(pinned !== undefined && { pinned }),
      ...(topic !== undefined && { topic: topic as Topic }),
      ...(tags !== undefined && { tags }),
      ...(contradicts !== undefined && { contradicts }),
      ...(conflictReasons !== undefined && { conflictReasons }),
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH /api/memories error:", err);
    return NextResponse.json({ error: "Failed to update memory" }, { status: 500 });
  }
}

// DELETE /api/memories/[id]
export async function DELETE(req: NextRequest, { params }: Params) {
  const { id: memoryId } = await params;
  const body = await req.json();
  const userId = await resolveUserId(req, body.userId);
  if (!userId) return unauthorized();
  const { createdAt } = body;

  if (!createdAt) {
    return NextResponse.json(
      { error: "userId and createdAt required" },
      { status: 400 }
    );
  }

  try {
    await deleteMemory(userId, memoryId, createdAt);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/memories error:", err);
    return NextResponse.json({ error: "Failed to delete memory" }, { status: 500 });
  }
}
