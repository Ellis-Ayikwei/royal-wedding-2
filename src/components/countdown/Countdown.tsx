"use client";

import { useEffect, useState } from "react";
import { Eyebrow } from "../ui/primitives";

function getRemaining(target: number) {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    done: diff <= 0,
  };
}

export function Countdown({ weddingDate }: { weddingDate: string }) {
  const target = new Date(weddingDate).getTime();
  const [time, setTime] = useState<ReturnType<typeof getRemaining> | null>(null);

  useEffect(() => {
    const id = setInterval(() => setTime(getRemaining(target)), 1000);
    const raf = requestAnimationFrame(() => setTime(getRemaining(target)));
    return () => {
      clearInterval(id);
      cancelAnimationFrame(raf);
    };
  }, [target]);

  const units: { label: string; value: number }[] = time
    ? [
        { label: "Days", value: time.days },
        { label: "Hours", value: time.hours },
        { label: "Minutes", value: time.minutes },
        { label: "Seconds", value: time.seconds },
      ]
    : [
        { label: "Days", value: 0 },
        { label: "Hours", value: 0 },
        { label: "Minutes", value: 0 },
        { label: "Seconds", value: 0 },
      ];

  return (
    <section className="relative py-20 px-6 bg-gradient-to-b from-navy-900 via-emerald-900/40 to-navy-900 border-y border-emerald-400/25">
      <div className="absolute inset-0 pattern-dots opacity-[0.04]" />
      <div className="relative max-w-3xl mx-auto text-center">
        <Eyebrow>{time?.done ? "The Celebration Has Begun" : "Counting Down To"}</Eyebrow>
        <div className="mt-10 grid grid-cols-4 gap-3 sm:gap-8">
          {units.map((u, i) => (
            <div key={u.label} className="relative">
              <div className="font-display text-4xl sm:text-6xl text-gold-gradient font-medium tabular-nums">
                {String(u.value).padStart(2, "0")}
              </div>
              <div className="mt-2 text-[10px] sm:text-xs tracking-[0.2em] uppercase text-ivory-100/50">
                {u.label}
              </div>
              {i < units.length - 1 && (
                <span className="hidden sm:block absolute top-4 -right-4 text-emerald-400/50 text-3xl">·</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
