"use client";

import { Radio, Play, Video, MessageCircle, Tv, Link as LinkIcon } from "lucide-react";
import { SectionHeading, PrimaryButton } from "../ui/primitives";
import type { StreamSettings } from "@/lib/types";

const PLATFORM_META: Record<string, { label: string; icon: typeof Play }> = {
  youtube: { label: "Watch on YouTube", icon: Play },
  zoom: { label: "Join on Zoom", icon: Video },
  google_meet: { label: "Join on Google Meet", icon: Video },
  discord: { label: "Join on Discord", icon: MessageCircle },
  twitch: { label: "Watch on Twitch", icon: Tv },
  custom: { label: "Join the Celebration", icon: LinkIcon },
};

export function StreamingSection({ stream }: { stream: StreamSettings }) {
  if (!stream.enabled) return null;

  const meta = PLATFORM_META[stream.platform] ?? PLATFORM_META.custom;
  const Icon = meta.icon;

  return (
    <section id="live" className="relative py-24 sm:py-28 px-6 bg-navy-900 border-y border-emerald-400/20">
      <div className="max-w-2xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 text-rose-300 text-xs tracking-[0.2em] uppercase mb-6">
          <Radio size={14} className="animate-pulse" /> Live
        </div>
        <SectionHeading title={stream.title || "Join the Celebration"} />
        <p className="mt-4 text-ivory-100/60 text-sm">
          Can&apos;t make it in person? Join us from anywhere in the world.
        </p>
        {stream.url && (
          <a href={stream.url} target="_blank" rel="noopener noreferrer" className="mt-8 inline-block">
            <PrimaryButton>
              <Icon size={16} /> {meta.label}
            </PrimaryButton>
          </a>
        )}
      </div>
    </section>
  );
}
