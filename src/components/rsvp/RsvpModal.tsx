"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, Loader2, AlertCircle, Users } from "lucide-react";
import { PrimaryButton, GhostButton } from "../ui/primitives";
import type { Invitation } from "./RsvpProvider";

/** How long the confirmation stays on screen before the guest is taken to the site. */
const REDIRECT_DELAY_MS = 4000;

type Attendance = "accepted" | "declined";
type Status = "idle" | "loading" | "success" | "error";

export function RsvpModal({
  invitation,
  onClose,
}: {
  invitation: Invitation;
  onClose: () => void;
}) {
  const [phone, setPhone] = useState(invitation.phone ?? "");
  const [attendance, setAttendance] = useState<Attendance>("accepted");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // The invitation page was rendered before this response existed, so sending the guest
  // back to it would show the Accept button again. Take them to the wedding site instead.
  useEffect(() => {
    if (status !== "success") return;
    const timer = setTimeout(() => router.push("/"), REDIRECT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [status, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (phone.trim().length < 7) {
      setError("Please enter a valid phone number.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: invitation.token,
          phone: phone.trim(),
          attendance,
          message: message.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus("error");
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setError("We could not reach the server. Please try again.");
    }
  }

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="rsvp-title"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-navy-950/85 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-navy-900 border border-emerald-400/30 rounded-md shadow-2xl"
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 text-ivory-100/60 hover:text-emerald-300 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-300 rounded-sm"
          >
            <X size={20} />
          </button>

          <div className="p-8 sm:p-10">
            {status === "success" ? (
              <div className="text-center py-8">
                <div
                  className={`mx-auto mb-6 h-14 w-14 rounded-full border flex items-center justify-center ${
                    attendance === "accepted"
                      ? "border-emerald-400/70 bg-emerald-500/10"
                      : "border-gold-300/60"
                  }`}
                >
                  <Check className={attendance === "accepted" ? "text-emerald-300" : "text-gold-300"} size={26} />
                </div>
                <h3 id="rsvp-title" className="font-display text-2xl text-gold-gradient mb-3">
                  {attendance === "accepted"
                    ? "Your presence has been graciously confirmed."
                    : "Thank you for letting us know."}
                </h3>
                <p className="text-ivory-100/70 text-sm leading-relaxed">
                  {attendance === "accepted"
                    ? `We are delighted you will join us for this celebration. Your response has been recorded for ${
                        invitation.guestCount > 1
                          ? `your party of ${invitation.guestCount}`
                          : invitation.name
                      }.`
                    : "We will miss you, and we're grateful you took a moment to respond."}
                </p>
                <GhostButton className="mt-8" onClick={() => router.push("/")}>
                  Continue to the wedding site
                </GhostButton>
                <p className="mt-3 text-[11px] text-ivory-100/40">
                  Taking you there in a moment.
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <span className="font-display italic text-xs tracking-[0.3em] uppercase text-gold-300">
                    Kindly Respond
                  </span>
                  <h3 id="rsvp-title" className="font-display text-3xl mt-2 text-ivory-50">
                    Accept the Invitation
                  </h3>
                </div>

                {/* Identity comes from the invitation, not from the guest typing it. */}
                <div className="mb-7 rounded-sm border border-emerald-400/25 bg-emerald-900/25 px-5 py-4 text-center">
                  <p className="text-[10px] tracking-[0.25em] uppercase text-ivory-100/50">
                    This invitation is for
                  </p>
                  <p className="mt-1.5 font-display text-xl text-ivory-50">{invitation.name}</p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-200">
                    <Users size={13} />
                    {invitation.guestCount > 1
                      ? `Admitting ${invitation.guestCount} guests`
                      : "Admitting 1 guest"}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <fieldset>
                    <legend className="block text-xs tracking-widest uppercase text-ivory-100/60 mb-2">
                      Will you attend?
                    </legend>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAttendance("accepted")}
                        className={`py-3 rounded-sm border text-sm tracking-wide transition-colors ${
                          attendance === "accepted"
                            ? "border-emerald-400 bg-emerald-500/15 text-emerald-200"
                            : "border-gold-400/20 text-ivory-100/60 hover:border-emerald-400/40"
                        }`}
                      >
                        Joyfully Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttendance("declined")}
                        className={`py-3 rounded-sm border text-sm tracking-wide transition-colors ${
                          attendance === "declined"
                            ? "border-gold-300 bg-gold-300/10 text-gold-200"
                            : "border-gold-400/20 text-ivory-100/60 hover:border-gold-400/40"
                        }`}
                      >
                        Regretfully Decline
                      </button>
                    </div>
                  </fieldset>

                  <div>
                    <label htmlFor="rsvp-phone" className="block text-xs tracking-widest uppercase text-ivory-100/60 mb-2">
                      Phone Number
                    </label>
                    <input
                      id="rsvp-phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      type="tel"
                      className="w-full bg-navy-800/60 border border-gold-400/25 rounded-sm px-4 py-3 text-ivory-50 placeholder:text-ivory-100/30 focus:outline-none focus:border-emerald-300 transition-colors"
                      placeholder="+233 ..."
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="rsvp-message" className="block text-xs tracking-widest uppercase text-ivory-100/60 mb-2">
                      A Note for the Couple
                    </label>
                    <textarea
                      id="rsvp-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="w-full bg-navy-800/60 border border-gold-400/25 rounded-sm px-4 py-3 text-ivory-50 placeholder:text-ivory-100/30 focus:outline-none focus:border-emerald-300 transition-colors resize-none"
                      placeholder="Optional"
                    />
                  </div>

                  <p className="text-[11px] text-ivory-100/40 leading-relaxed">
                    Your response is recorded once. To change it afterwards, please contact the couple.
                  </p>

                  {error && (
                    <div className="flex items-center gap-2 text-sm text-rose-300 bg-rose-500/10 border border-rose-400/30 rounded-sm px-4 py-3">
                      <AlertCircle size={16} />
                      {error}
                    </div>
                  )}

                  <PrimaryButton type="submit" className="w-full" disabled={status === "loading"}>
                    {status === "loading" ? (
                      <>
                        <Loader2 className="animate-spin" size={16} /> Sending...
                      </>
                    ) : (
                      "Confirm Response"
                    )}
                  </PrimaryButton>
                </form>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
