"use client";

import { useRef, useState } from "react";
import { Link2, Upload, Loader2, ImageOff } from "lucide-react";
import { Field, Input, useToast } from "./AdminUI";
import { uploadDirect } from "@/lib/directUpload";

export function ImageUploader({
  label,
  id,
  value,
  onChange,
}: {
  label: string;
  id: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const { push } = useToast();
  const [mode, setMode] = useState<"link" | "upload">("link");
  const [uploading, setUploading] = useState(false);
  const [broken, setBroken] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/") && !/\.hei[cf]$/i.test(file.name)) {
      push("Please choose an image file.", "error");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      push("Image is too large. Maximum size is 8MB.", "error");
      return;
    }
    setUploading(true);
    try {
      const result = await uploadDirect(file, "/api/admin/upload-url");
      if (result.mode === "direct") {
        setBroken(false);
        onChange(result.publicUrl);
        push("Image uploaded");
        return;
      }

      // No R2 configured (local development): send the file straight to our server.
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        push(data.error || "Could not upload the image.", "error");
        return;
      }
      setBroken(false);
      onChange(data.url);
      push("Image uploaded");
    } catch (err) {
      push(err instanceof Error ? err.message : "Could not reach the server. Please try again.", "error");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Field label={label} htmlFor={id}>
      <div className="flex gap-1 mb-2 border border-gold-400/20 rounded-sm p-0.5 w-fit">
        <button
          type="button"
          onClick={() => setMode("link")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[11px] tracking-wide transition-colors ${
            mode === "link" ? "bg-gold-300/15 text-gold-200" : "text-ivory-100/50 hover:text-ivory-100/80"
          }`}
        >
          <Link2 size={12} /> Paste a link
        </button>
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[11px] tracking-wide transition-colors ${
            mode === "upload" ? "bg-gold-300/15 text-gold-200" : "text-ivory-100/50 hover:text-ivory-100/80"
          }`}
        >
          <Upload size={12} /> Upload from device
        </button>
      </div>

      {mode === "link" ? (
        <Input
          id={id}
          value={value}
          onChange={(e) => {
            setBroken(false);
            onChange(e.target.value);
          }}
          placeholder="https://images.unsplash.com/..."
        />
      ) : (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.heic,.heif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 border border-dashed border-gold-400/30 rounded-sm py-4 text-xs text-ivory-100/60 hover:border-gold-400/60 hover:text-gold-200 transition-colors disabled:opacity-60"
          >
            {uploading ? (
              <>
                <Loader2 size={15} className="animate-spin" /> Uploading...
              </>
            ) : (
              <>
                <Upload size={15} /> Choose an image (JPG, PNG, WEBP, GIF, SVG, HEIC · up to 8MB)
              </>
            )}
          </button>
        </div>
      )}

      {value && (
        <div className="mt-3 relative h-32 w-full rounded-sm overflow-hidden border border-gold-400/20 bg-navy-950 flex items-center justify-center">
          {broken ? (
            <div className="flex flex-col items-center gap-1.5 text-ivory-100/35">
              <ImageOff size={20} />
              <span className="text-[11px]">Image failed to load</span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-full h-full object-cover" onError={() => setBroken(true)} />
          )}
        </div>
      )}
    </Field>
  );
}
