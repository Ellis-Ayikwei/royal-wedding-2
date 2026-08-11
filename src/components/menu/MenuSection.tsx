"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { SectionHeading } from "../ui/primitives";
import type { MenuItem, MenuSettings } from "@/lib/types";

function getRemaining(target: number) {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    done: diff <= 0,
  };
}

export function MenuSection({
  items,
  settings,
  isVisible,
}: {
  items: MenuItem[];
  settings: MenuSettings;
  isVisible: boolean;
}) {
  const [visible, setVisible] = useState(isVisible);
  const [remaining, setRemaining] = useState<ReturnType<typeof getRemaining> | null>(null);

  useEffect(() => {
    if (visible || settings.visibilityMode !== "scheduled" || !settings.releaseAt) return;
    const target = new Date(settings.releaseAt).getTime();
    const tick = () => {
      const r = getRemaining(target);
      setRemaining(r);
      if (r.done) setVisible(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [visible, settings]);

  const categories = Array.from(new Set(items.map((i) => i.category)));

  if (settings.visibilityMode === "hidden" && !visible) return null;

  return (
    <section
      id="menu"
      className="relative py-24 sm:py-32 px-6 bg-navy-950 bg-gradient-to-b from-navy-950 via-emerald-900/50 to-navy-950"
    >
      {visible ? (
        <>
          <SectionHeading eyebrow="Tonight's Table" title="The Royal Feast" />
          <div className="max-w-4xl mx-auto mt-16 grid sm:grid-cols-2 gap-x-14 gap-y-12">
            {categories.map((category) => (
              <div key={category}>
                <h3 className="font-display italic text-gold-300 text-lg mb-4 pb-2 border-b border-emerald-400/30">
                  {category}
                </h3>
                <ul className="space-y-4">
                  {items
                    .filter((i) => i.category === category && i.available)
                    .map((item) => (
                      <li key={item.id}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-ivory-50 text-sm sm:text-base">{item.name}</span>
                          <span className="flex-1 border-b border-dotted border-gold-400/20 translate-y-[-2px]" />
                        </div>
                        {item.description && (
                          <p className="text-xs text-ivory-100/50 mt-0.5">{item.description}</p>
                        )}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-xl mx-auto text-center"
        >
          <SectionHeading eyebrow="Coming Soon" title="Tonight's Royal Feast Will Be Revealed In" />
          {remaining && (
            <div className="mt-10 flex justify-center gap-6 sm:gap-10">
              {[
                { label: "Days", value: remaining.days },
                { label: "Hours", value: remaining.hours },
                { label: "Minutes", value: remaining.minutes },
              ].map((u) => (
                <div key={u.label}>
                  <div className="font-display text-3xl sm:text-4xl text-gold-gradient tabular-nums">
                    {String(u.value).padStart(2, "0")}
                  </div>
                  <div className="mt-1 text-[10px] tracking-[0.2em] uppercase text-ivory-100/50">
                    {u.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </section>
  );
}
