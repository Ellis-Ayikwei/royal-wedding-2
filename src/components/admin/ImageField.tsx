"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";
import { Field, Input } from "./AdminUI";

/**
 * Image URL field with a live preview. File uploading was removed deliberately —
 * it required Vercel Blob storage in production and a writable disk locally, neither
 * of which is worth the deployment complexity for a handful of images. Paste a link
 * (including a path like /uploads/gallery/photo.webp for files shipped with the site).
 */
export function ImageField({
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
  const [broken, setBroken] = useState(false);

  return (
    <Field label={label} htmlFor={id}>
      <Input
        id={id}
        value={value}
        onChange={(e) => {
          setBroken(false);
          onChange(e.target.value);
        }}
        placeholder="https://... or /uploads/gallery/photo.webp"
      />

      {value && (
        <div className="mt-3 relative h-32 w-full rounded-sm overflow-hidden border border-emerald-400/20 bg-navy-950 flex items-center justify-center">
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
