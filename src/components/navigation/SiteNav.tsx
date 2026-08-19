"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Monogram } from "../ui/Monogram";
import { useRsvp } from "../rsvp/RsvpProvider";

const LINKS = [
  { href: "#story", label: "Our Story" },
  { href: "#events", label: "Events" },
  { href: "#menu", label: "Menu" },
  { href: "#venue", label: "Location" },
  { href: "#live", label: "Live" },
];

export function SiteNav({ coupleNames }: { coupleNames: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { open, canRespond } = useRsvp();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-navy-950/90 backdrop-blur-md border-b border-emerald-400/25 py-3" : "bg-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5 text-gold-200">
            <Monogram className="h-8 w-8" />
            <span className="font-display italic text-sm tracking-wide hidden sm:inline">{coupleNames}</span>
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs tracking-[0.15em] uppercase text-ivory-100/75 hover:text-gold-300 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {canRespond && (
              <button
                onClick={open}
                className="hidden sm:inline-flex items-center px-5 py-2.5 border border-emerald-400/70 text-emerald-200 text-xs tracking-[0.2em] uppercase rounded-sm hover:bg-emerald-500/15 transition-colors"
              >
                RSVP
              </button>
            )}
            <button
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
              className="md:hidden text-gold-200 p-1"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-navy-950/80 backdrop-blur-sm md:hidden"
              onClick={() => setDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="fixed right-0 top-0 bottom-0 z-[70] w-[82%] max-w-xs bg-navy-900 border-l border-emerald-400/30 md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-emerald-400/20">
                <Monogram className="h-8 w-8 text-gold-200" />
                <button aria-label="Close menu" onClick={() => setDrawerOpen(false)} className="text-gold-200">
                  <X size={22} />
                </button>
              </div>
              <nav className="flex flex-col gap-1 p-6">
                {LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setDrawerOpen(false)}
                    className="py-3.5 text-sm tracking-[0.15em] uppercase text-ivory-100/80 border-b border-emerald-400/15 hover:text-emerald-300 transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              {canRespond && (
                <div className="mt-auto p-6">
                  <button
                    onClick={() => {
                      setDrawerOpen(false);
                      open();
                    }}
                    className="w-full py-3.5 bg-gradient-to-b from-gold-300 to-gold-500 text-navy-950 text-xs tracking-[0.2em] uppercase rounded-sm font-medium"
                  >
                    Accept the Invitation
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
