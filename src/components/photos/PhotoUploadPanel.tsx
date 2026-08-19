"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, AlertCircle, Check, Loader2, X } from "lucide-react";
import type { EventPhoto } from "@/lib/types";
import { uploadDirect } from "@/lib/directUpload";

type Stage = "idle" | "converting" | "resizing" | "uploading" | "saving" | "done" | "error";

const STAGE_LABEL: Record<Stage, string> = {
  idle: "",
  converting: "Converting your photo",
  resizing: "Optimizing your photo",
  uploading: "Uploading",
  saving: "Almost there",
  done: "Posted to the wall",
  error: "",
};

export function PhotoUploadPanel({ onUploaded }: { onUploaded: (photo: EventPhoto) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [caption, setCaption] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setName("");
    setCaption("");
    setStage("idle");
    setProgress(0);
    setError(null);
  }

  function pickFile(picked: File) {
    if (!picked.type.startsWith("image/") && !/\.hei[cf]$/i.test(picked.name)) {
      setError("Please choose a photo.");
      return;
    }
    setError(null);
    setFile(picked);
    setPreviewUrl(URL.createObjectURL(picked));
  }

  async function submit() {
    if (!file) return;
    setError(null);
    try {
      setProgress(0);
      const result = await uploadDirect(
        file,
        "/api/photos/upload-url",
        (s) => setStage(s),
        (p) => setProgress(p)
      );

      setStage("saving");
      let res: Response;
      if (result.mode === "direct") {
        res = await fetch("/api/photos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: result.publicUrl,
            uploaderName: name.trim() || undefined,
            caption: caption.trim() || undefined,
          }),
        });
      } else {
        // No R2 configured (local development): send the file straight to our own
        // server instead, which writes it to public/event-photos and saves the row.
        const form = new FormData();
        form.append("file", file);
        if (name.trim()) form.append("uploaderName", name.trim());
        if (caption.trim()) form.append("caption", caption.trim());
        res = await fetch("/api/photos", { method: "POST", body: form });
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save your photo.");

      onUploaded(data.photo);
      setStage("done");
      setTimeout(reset, 1600);
    } catch (err) {
      setStage("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  const busy = stage === "converting" || stage === "resizing" || stage === "uploading" || stage === "saving";

  return (
    <div className="rounded-2xl border border-gold-400/25 bg-navy-900/70 backdrop-blur-sm p-5 sm:p-6">
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.heic,.heif"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          if (picked) pickFile(picked);
          e.target.value = "";
        }}
      />

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gold-400/35 py-8 text-ivory-100/70 hover:border-gold-300/60 hover:text-gold-200 transition-colors"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-gold-300 to-gold-500 text-navy-950">
            <Camera size={20} />
          </span>
          <span className="text-sm tracking-wide">Share a photo from the celebration</span>
        </button>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative shrink-0 w-full sm:w-32 h-40 sm:h-32 rounded-xl overflow-hidden border border-gold-400/20 bg-navy-950">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Selected photo" className="w-full h-full object-cover" />
            )}
            {!busy && stage !== "done" && (
              <button
                type="button"
                onClick={reset}
                aria-label="Remove photo"
                className="absolute top-1.5 right-1.5 h-6 w-6 flex items-center justify-center rounded-full bg-navy-950/80 text-ivory-100/80 hover:text-rose-300"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex-1 space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy || stage === "done"}
              placeholder="Your name (optional)"
              className="w-full bg-navy-950 border border-gold-400/20 rounded-lg px-3.5 py-2.5 text-sm text-ivory-50 placeholder:text-ivory-100/30 focus:outline-none focus:border-gold-300 transition-colors disabled:opacity-60"
            />
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              disabled={busy || stage === "done"}
              placeholder="Add a caption (optional)"
              className="w-full bg-navy-950 border border-gold-400/20 rounded-lg px-3.5 py-2.5 text-sm text-ivory-50 placeholder:text-ivory-100/30 focus:outline-none focus:border-gold-300 transition-colors disabled:opacity-60"
            />

            {error && (
              <div className="flex items-center gap-2 text-xs text-rose-200 bg-rose-500/10 border border-rose-400/30 rounded-lg px-3 py-2.5">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={submit}
                disabled={busy || stage === "done"}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-medium tracking-[0.1em] uppercase bg-gradient-to-b from-gold-300 to-gold-500 text-navy-950 disabled:opacity-70 transition-all"
              >
                {stage === "done" ? (
                  <>
                    <Check size={14} /> Posted
                  </>
                ) : busy ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    {STAGE_LABEL[stage]}
                    {stage === "uploading" && progress > 0 ? ` ${progress}%` : ""}
                  </>
                ) : (
                  "Post to the wall"
                )}
              </button>
              {!busy && stage !== "done" && (
                <button
                  type="button"
                  onClick={reset}
                  className="text-xs text-ivory-100/50 hover:text-ivory-100/80"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {stage === "done" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-xs text-emerald-300"
          >
            Thank you. Your photo is live on the wall below.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
