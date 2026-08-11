import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGuestByToken, submitRsvp } from "@/lib/repo";

// RSVP is invitation-only: a valid token identifies the guest, so the name and the
// size of their party come from the guest record rather than from the form.
const schema = z.object({
  token: z.string().min(1),
  phone: z.string().min(7).max(30),
  attendance: z.enum(["accepted", "declined"]),
  message: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check your details and try again." },
      { status: 400 }
    );
  }

  const { token, phone, attendance, message } = parsed.data;

  const guest = await getGuestByToken(token);
  if (!guest) {
    return NextResponse.json({ error: "This invitation link is not recognized." }, { status: 404 });
  }

  // One response per invitation.
  if (guest.rsvpStatus !== "pending") {
    return NextResponse.json(
      {
        error:
          guest.rsvpStatus === "accepted"
            ? "This invitation has already been accepted. Please contact the couple to change your response."
            : "A response has already been recorded for this invitation. Please contact the couple to change it.",
        alreadyResponded: true,
      },
      { status: 409 }
    );
  }

  const updated = await submitRsvp(token, { attendance, phone, message });

  return NextResponse.json({ guest: updated });
}
