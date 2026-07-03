import { NextRequest, NextResponse } from "next/server";
import { createOrg, getOrg, addOrgMember, getOrgMemories, getMergedMemories } from "@/lib/dynamodb";
import { v4 as uuidv4 } from "uuid";
import { resolveUserId, unauthorized } from "@/lib/authz";

// POST /api/org — create org
// Body: { name, adminUserId, encryptedApiKey? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const adminUserId = await resolveUserId(req, body.adminUserId);
    if (!adminUserId) return unauthorized();
    const { name, encryptedApiKey } = body;
    if (!name) {
      return NextResponse.json({ error: "name and adminUserId required" }, { status: 400 });
    }
    const orgId = uuidv4();
    const org = await createOrg(orgId, name, adminUserId, encryptedApiKey);
    return NextResponse.json({ org });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET /api/org?orgId=&userId= — get org + merged memories
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("orgId");
    const requestedUserId = searchParams.get("userId");

    if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

    const org = await getOrg(orgId);
    if (!org) return NextResponse.json({ error: "Org not found" }, { status: 404 });

    // If userId provided, return merged personal + org memories. Resolve the
    // caller's identity so one member can't read another's personal memories.
    if (requestedUserId) {
      const userId = await resolveUserId(req, requestedUserId);
      if (!userId) return unauthorized();
      const memories = await getMergedMemories(userId, orgId);
      return NextResponse.json({ org, memories });
    }

    const memories = await getOrgMemories(orgId);
    return NextResponse.json({ org, memories });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH /api/org — add member to org
// Body: { orgId, userId }
export async function PATCH(req: NextRequest) {
  try {
    const { orgId, userId } = await req.json();
    if (!orgId || !userId) {
      return NextResponse.json({ error: "orgId and userId required" }, { status: 400 });
    }
    await addOrgMember(orgId, userId);
    return NextResponse.json({ ok: true, message: `${userId} added to org ${orgId}` });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
