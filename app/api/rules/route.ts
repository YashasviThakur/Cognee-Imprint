import { NextRequest, NextResponse } from "next/server";
import { getMemoryRules, saveMemoryRules, addMemoryRule, updateMemoryRule, deleteMemoryRule } from "@/lib/dynamodb";
import { resolveUserId, unauthorized } from "@/lib/authz";

// GET /api/rules?userId=
export async function GET(req: NextRequest) {
  const userId = await resolveUserId(req, req.nextUrl.searchParams.get("userId"));
  if (!userId) return unauthorized();
  const prefs = await getMemoryRules(userId);
  return NextResponse.json(prefs);
}

// POST /api/rules — add a custom rule
// Body: { userId, label, topic, enabled, keywords?, pattern? }
export async function POST(req: NextRequest) {
  const { userId: _userId, ...rule } = await req.json();
  const userId = await resolveUserId(req, _userId);
  if (!userId) return unauthorized();
  if (!rule.label || !rule.topic) {
    return NextResponse.json({ error: "userId, label, topic required" }, { status: 400 });
  }
  const newRule = await addMemoryRule(userId, { enabled: true, ...rule });
  return NextResponse.json({ rule: newRule });
}

// PATCH /api/rules — toggle or update a rule
// Body: { userId, ruleId, ...updates }
export async function PATCH(req: NextRequest) {
  const { userId: _userId, ruleId, ...updates } = await req.json();
  const userId = await resolveUserId(req, _userId);
  if (!userId) return unauthorized();
  if (!ruleId) return NextResponse.json({ error: "userId, ruleId required" }, { status: 400 });
  await updateMemoryRule(userId, ruleId, updates);
  return NextResponse.json({ ok: true });
}

// DELETE /api/rules?userId=&ruleId=
export async function DELETE(req: NextRequest) {
  const userId = await resolveUserId(req, req.nextUrl.searchParams.get("userId"));
  if (!userId) return unauthorized();
  const ruleId = req.nextUrl.searchParams.get("ruleId");
  if (!ruleId) return NextResponse.json({ error: "userId, ruleId required" }, { status: 400 });
  await deleteMemoryRule(userId, ruleId);
  return NextResponse.json({ ok: true });
}
