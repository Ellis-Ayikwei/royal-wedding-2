import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/auth";
import { regenerateInvitationToken } from "@/lib/repo";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdminFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const guest = await regenerateInvitationToken(id);
  if (!guest) return NextResponse.json({ error: "Guest not found." }, { status: 404 });
  return NextResponse.json({ guest });
}
