import { NextRequest, NextResponse } from "next/server";
import { getInsights } from "@/lib/memory-store";
import { resolveUserId, unauthorized } from "@/lib/authz";

// GET /api/insights?userId=  → recurring patterns across a user's memories.
// Prefers Cognee graph INSIGHTS; always returns computed stats as a fallback.
export async function GET(req: NextRequest) {
  const userId = await resolveUserId(req, req.nextUrl.searchParams.get("userId"));
  if (!userId) return unauthorized();
  try {
    const insights = await getInsights(userId);
    return NextResponse.json(insights);
  } catch (err) {
    console.error("GET /api/insights error:", err);
    return NextResponse.json({ error: "Failed to compute insights" }, { status: 500 });
  }
}
