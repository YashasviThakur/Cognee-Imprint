import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserIdFromApiKey } from "@/app/api/keys/route";

// Authorization helpers.
//
// Browser/dashboard requests carry a NextAuth session whose `user.id` IS the
// userId. The keyless MCP server / stop-hook do NOT — they call the API with a
// userId param and no session. So these guards are for routes that are ONLY ever
// called from the logged-in dashboard; applying them to MCP-shared routes
// (/api/memories CRUD, /api/rules, /api/sessions) would lock out the MCP.

// LOCAL_MODE bypass: this isolated, Cognee-powered build runs locally with no
// Google OAuth, so the dashboard is reached via ?userId=local-dev. Ownership
// checks are relaxed ONLY in local mode. This is a POSITIVE opt-in
// (STORAGE_BACKEND != "dynamodb"), NOT keyed off the absence of AWS creds, so a
// real deployment (STORAGE_BACKEND=dynamodb) keeps full ownership enforcement.
const LOCAL_MODE = (process.env.STORAGE_BACKEND || "local").toLowerCase() !== "dynamodb";

// Require a signed-in session that owns `userId`. Returns null when authorized,
// or a 401/403 response to return immediately.
export async function requireOwner(userId: string | null | undefined): Promise<NextResponse | null> {
  if (LOCAL_MODE) return null; // local Cognee demo — no OAuth required
  const session = await auth();
  const sid = session?.user?.id;
  if (!sid) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!userId || sid !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

// For expensive maintenance endpoints (backfill, recheck): allow either the
// session owner OR a request carrying the ADMIN_KEY. Returns null when allowed.
export async function requireOwnerOrAdminKey(userId: string | null | undefined, providedKey: unknown): Promise<NextResponse | null> {
  const adminKey = process.env.ADMIN_KEY;
  if (adminKey && typeof providedKey === "string" && providedKey === adminKey) return null;
  return requireOwner(userId);
}

// Canonical guard for MCP-shared routes that BOTH the dashboard and the MCP
// server call (/api/memories CRUD, /api/rules, /api/sessions, /api/insights, …).
// Resolves the authenticated userId without trusting a bare ?userId= param, so
// it closes the "read any user's data by userId" hole while keeping keyed MCP
// clients working. Resolution order:
//   1. Authorization: Bearer imp_live_…  → per-user API key (MCP sends this when
//      IMPRINT_API_KEY is set; see mcp/server.js apiFetch).
//   2. NextAuth session cookie           → the signed-in dashboard user.
//   3. LOCAL_MODE fallback               → trust `requested` (local Cognee demo
//      only; never true on a STORAGE_BACKEND=dynamodb deploy).
// `requested` is the userId the caller asked for (query or body). When present it
// MUST match the resolved identity — a signed-in user cannot read another's data.
// Returns the authorised userId, or null (→ respond with unauthorized()).
export async function resolveUserId(req: NextRequest, requested?: string | null): Promise<string | null> {
  const bearer = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (bearer) {
    const uid = await getUserIdFromApiKey(bearer);
    if (!uid) return null;
    return !requested || requested === uid ? uid : null;
  }

  const session = await auth();
  const sid = session?.user?.id;
  if (sid) return !requested || requested === sid ? sid : null;

  if (LOCAL_MODE && requested) return requested;
  return null;
}

// Standard 401 for an unauthenticated or mismatched caller.
export function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: "Unauthorized — sign in, or set IMPRINT_API_KEY in your MCP config" },
    { status: 401 },
  );
}
