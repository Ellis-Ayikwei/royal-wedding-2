"use client";

import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { RsvpModal } from "./RsvpModal";
import type { RsvpStatus } from "@/lib/types";

export interface Invitation {
  token: string;
  name: string;
  phone: string;
  guestCount: number;
  rsvpStatus: RsvpStatus;
}

interface RsvpContextValue {
  /** The invited guest, or null when the page was reached without a valid token. */
  invitation: Invitation | null;
  /** True only for a valid invitation that has not been answered yet. */
  canRespond: boolean;
  open: () => void;
  close: () => void;
}

const RsvpContext = createContext<RsvpContextValue | null>(null);

export function useRsvp() {
  const ctx = useContext(RsvpContext);
  if (!ctx) throw new Error("useRsvp must be used within RsvpProvider");
  return ctx;
}

export function RsvpProvider({
  children,
  invitation = null,
}: {
  children: ReactNode;
  invitation?: Invitation | null;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const canRespond = invitation !== null && invitation.rsvpStatus === "pending";

  const open = useCallback(() => {
    if (canRespond) setIsOpen(true);
  }, [canRespond]);

  const close = useCallback(() => setIsOpen(false), []);

  return (
    <RsvpContext.Provider value={{ invitation, canRespond, open, close }}>
      {children}
      {isOpen && invitation && <RsvpModal invitation={invitation} onClose={close} />}
    </RsvpContext.Provider>
  );
}
