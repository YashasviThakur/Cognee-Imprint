import { NextRequest, NextResponse } from "next/server";
import { getMemoryPool } from "@/lib/pool";
import { cosineSimilarity } from "@/lib/embeddings";
import { resolveUserId, unauthorized } from "@/lib/authz";

// Finds clusters of near-duplicate memories (same fact saved/extracted more than
// once, often slightly reworded). Greedy clustering by embedding cosine ≥ 0.9.
// POST { userId } → { clusters: [[{ id, content, topic, createdAt, pinned }]] }

export const maxDuration = 30;
const DUP_THRESHOLD = 0.9;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const userId = await resolveUserId(req, body.userId);
  if (!userId) return unauthorized();

  try {
    const all = await getMemoryPool(userId, 1000);
    const withEmb = all.filter((m) => m.embedding && m.embedding.length);
    const used = new Set<string>();
    const clusters: { id: string; content: string; topic: string; createdAt: string; pinned: boolean }[][] = [];

    for (let i = 0; i < withEmb.length; i++) {
      const a = withEmb[i];
      if (used.has(a.memoryId)) continue;
      const group = [a];
      used.add(a.memoryId);
      for (let j = i + 1; j < withEmb.length; j++) {
        const b = withEmb[j];
        if (used.has(b.memoryId)) continue;
        if (cosineSimilarity(a.embedding!, b.embedding!) >= DUP_THRESHOLD) {
          group.push(b);
          used.add(b.memoryId);
        }
      }
      if (group.length > 1) {
        clusters.push(
          group.map((m) => ({ id: m.memoryId, content: m.content, topic: m.topic, createdAt: m.createdAt, pinned: !!m.pinned }))
        );
      }
    }

    // Largest clusters first.
    clusters.sort((x, y) => y.length - x.length);
    return NextResponse.json({ clusters });
  } catch (err) {
    console.error("POST /api/duplicates error:", err);
    return NextResponse.json({ error: "Failed to find duplicates" }, { status: 500 });
  }
}
