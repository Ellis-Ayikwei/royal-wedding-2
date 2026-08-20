"use client";

import { motion } from "framer-motion";
import { MapPin, Clock } from "lucide-react";
import { SectionHeading } from "../ui/primitives";
import type { WeddingEvent } from "@/lib/types";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

export function EventsTimeline({ events }: { events: WeddingEvent[] }) {
  return (
    <section id="events" className="relative py-24 sm:py-32 px-6 bg-navy-900">
      <SectionHeading eyebrow="The Programme" title="Celebration Lineup" />

      <div className="relative max-w-3xl mx-auto mt-16">
        <div className="absolute left-[27px] sm:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-emerald-400/50 to-transparent sm:-translate-x-1/2" />

        <div className="space-y-12">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6, delay: 0.05 }}
              className={`relative flex flex-col sm:flex-row items-start gap-5 sm:gap-10 ${
                i % 2 === 1 ? "sm:flex-row-reverse" : ""
              }`}
            >
              <div
                className={`absolute left-[19px] sm:left-1/2 top-1.5 h-4 w-4 rounded-full bg-navy-900 border-2 sm:-translate-x-1/2 z-10 ${
                  event.isFeatured === 1
                    ? "border-gold-400 shadow-[0_0_12px_rgba(201,162,75,0.5)]"
                    : "border-emerald-400"
                }`}
              />

              <div className="w-full sm:w-1/2 pl-14 sm:pl-0" />

              <div
                className={`w-full sm:w-1/2 pl-14 sm:pl-0 ${
                  i % 2 === 1 ? "sm:pr-10 sm:text-right" : "sm:pl-10"
                }`}
              >
                <div
                  className={`card-glass rounded-md overflow-hidden ${
                    event.isFeatured ? "border-gold-300/50 shadow-[0_0_30px_rgba(201,162,75,0.15)]" : ""
                  }`}
                >
                  {event.image && (
                    <div className="relative h-40 w-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={event.image} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 to-transparent" />
                    </div>
                  )}
                  <div className="p-5 sm:p-6">
                    {event.isFeatured === 1 && (
                      <span className="inline-block mb-2 text-[10px] tracking-[0.2em] uppercase text-gold-300 border border-gold-300/40 rounded-full px-2.5 py-1">
                        Main Ceremony
                      </span>
                    )}
                    <h3 className="font-display text-xl sm:text-2xl text-ivory-50">{event.title}</h3>
                    <p className="mt-2 text-sm text-ivory-100/60 leading-relaxed whitespace-pre-line">
                      {event.description}
                    </p>
                    <div
                      className={`mt-4 flex flex-col gap-1.5 text-xs text-gold-200/80 ${
                        i % 2 === 1 ? "sm:items-end" : ""
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} />
                        {formatDate(event.eventDate)}
                        {event.startTime ? ` · ${event.startTime}` : ""}
                        {event.endTime ? `-${event.endTime}` : ""}
                      </span>
                      {event.location && (
                        <span className="flex items-center gap-1.5">
                          <MapPin size={13} />
                          {event.location}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
