"use client";

import { useRef, useState } from "react";
import { Camera, Check, Image as ImageIcon, Loader2, Plus, Sparkles, Video, X } from "lucide-react";
import type { EventPhoto } from "@/lib/types";
import { uploadDirect } from "@/lib/directUpload";

const MAX_VIDEO_SECONDS = 120;
const MAX_BYTES = 50 * 1024 * 1024;

function isVideo(file: File): boolean {
  return file.type.startsWith("video/") || /\.(mov|mp4|m4v|hevc|3gp)$/i.test(file.name);
}

export function PhotoUploadPanel({ onUploaded }: { onUploaded: (photo: EventPhoto) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [caption, setCaption] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function clear() {
    previews.forEach((url) => URL.revokeObjectURL(url));
    setFiles([]); setPreviews([]); setName(""); setCaption(""); setProgress(0); setDone(false); setError(""); setOpen(false);
  }

  async function addFiles(picked: File[]) {
    setError("");
    const accepted: File[] = [];
    for (const file of picked) {
      if (file.size > MAX_BYTES) { setError(`${file.name} is larger than 50MB.`); continue; }
      if (!file.type.startsWith("image/") && !isVideo(file)) { setError(`${file.name} is not a supported image or video.`); continue; }
      if (isVideo(file)) {
        try {
          if (await getVideoDuration(file) > MAX_VIDEO_SECONDS) { setError(`${file.name} is longer than 2 minutes.`); continue; }
        } catch { setError(`Unable to read ${file.name}.`); continue; }
      }
      accepted.push(file);
    }
    setFiles((current) => [...current, ...accepted]);
    setPreviews((current) => [...current, ...accepted.map((file) => URL.createObjectURL(file))]);
  }

  function getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);
      video.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(video.duration); };
      video.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Could not read video")); };
      video.src = url;
    });
  }

  async function submit() {
    if (!files.length) { setError("Choose at least one photo or video."); return; }
    setBusy(true); setError("");
    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const result = await uploadDirect(file, "/api/photos/upload-url", undefined, (value) => setProgress(Math.round((index * 100 + value) / files.length)));
        const mediaType = isVideo(file) ? "video" : "image";
        let response: Response;
        if (result.mode === "direct") {
          response = await fetch("/api/photos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: result.publicUrl, mediaType, uploaderName: name.trim() || undefined, caption: caption.trim() || undefined }) });
        } else {
          const form = new FormData(); form.append("file", file); if (name.trim()) form.append("uploaderName", name.trim()); if (caption.trim()) form.append("caption", caption.trim());
          response = await fetch("/api/photos", { method: "POST", body: form });
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not save this moment.");
        onUploaded(data.photo);
      }
      setProgress(100); setDone(true); setTimeout(clear, 1300);
    } catch (err) { setError(err instanceof Error ? err.message : "Something went wrong. Please try again."); }
    finally { setBusy(false); }
  }

  function choose(ref: React.RefObject<HTMLInputElement | null>) { ref.current?.click(); }

  return <>
    <button type="button" onClick={() => setOpen(true)} className="group flex w-full items-center gap-4 rounded-2xl border border-gold-400/20 bg-navy-900/70 p-4 text-left shadow-lg shadow-black/10 transition hover:border-gold-300/45 hover:bg-navy-900">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-gold-300 to-gold-500 text-navy-950"><Camera size={19} /></span>
      <span><span className="block text-sm text-ivory-50">Share a moment</span><span className="mt-1 block text-xs text-ivory-100/45">Photos and videos from the celebration</span></span>
      <Plus size={18} className="ml-auto text-gold-300 transition group-hover:rotate-90" />
    </button>
    {open && <div className="fixed inset-0 z-[100]"><div className="absolute inset-0 bg-navy-950/85 backdrop-blur-sm" onClick={() => !busy && clear()} /><div className="absolute inset-x-0 bottom-0 mx-auto max-h-[92vh] max-w-2xl overflow-y-auto rounded-t-3xl border border-gold-400/20 bg-navy-900 shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-gold-400/15 bg-navy-900/95 px-5 py-4"><div><p className="font-display text-lg italic text-gold-200">Share your moment</p><p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-ivory-100/35">Photos and videos from the celebration</p></div><button type="button" disabled={busy} onClick={clear} aria-label="Close" className="text-ivory-100/50 hover:text-gold-200 disabled:opacity-30"><X size={19} /></button></div><div className="p-5 sm:p-6">
      {done ? <div className="flex flex-col items-center py-14 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/10 text-emerald-300"><Check size={27} /></span><h3 className="mt-5 font-display text-2xl text-ivory-50">Moment shared</h3><p className="mt-2 text-sm text-ivory-100/50">Your post is now on the wall.</p></div> : files.length === 0 ? <div className="space-y-3"><Option icon={<Camera size={19} />} title="Take a photo" detail="Open your camera" onClick={() => choose(cameraRef)} /><Option icon={<ImageIcon size={19} />} title="Choose photos" detail="Select images from your device" onClick={() => choose(fileRef)} /><Option icon={<Video size={19} />} title="Choose a video" detail="Common phone video formats, up to 2 minutes" onClick={() => choose(videoRef)} /></div> : <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{previews.map((url, index) => <Preview key={url} url={url} file={files[index]} onRemove={() => { URL.revokeObjectURL(url); setFiles((current) => current.filter((_, i) => i !== index)); setPreviews((current) => current.filter((_, i) => i !== index)); }} />)}<button type="button" onClick={() => choose(fileRef)} className="aspect-square rounded-xl border border-dashed border-gold-400/25 text-gold-300/60 hover:border-gold-300/50"><Plus size={20} className="mx-auto" /><span className="mt-2 block text-[9px] uppercase tracking-wider">Add more</span></button></div>
      <div className="mt-5 space-y-3"><input value={name} onChange={(e) => setName(e.target.value)} disabled={busy} placeholder="Your name (optional)" className="w-full rounded-lg border border-gold-400/20 bg-navy-950 px-3.5 py-2.5 text-sm text-ivory-50 placeholder:text-ivory-100/30 outline-none focus:border-gold-300" /><textarea value={caption} onChange={(e) => setCaption(e.target.value)} disabled={busy} maxLength={280} rows={3} placeholder="Add a caption (optional)" className="w-full resize-none rounded-lg border border-gold-400/20 bg-navy-950 px-3.5 py-2.5 text-sm text-ivory-50 placeholder:text-ivory-100/30 outline-none focus:border-gold-300" /></div>
      {progress > 0 && <div className="mt-5"><div className="mb-2 flex justify-between text-[10px] uppercase tracking-wider text-ivory-100/45"><span>Uploading</span><span>{progress}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-navy-950"><div className="h-full bg-emerald-400 transition-all" style={{ width: `${progress}%` }} /></div></div>}{error && <p className="mt-4 rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200">{error}</p>}<button type="button" onClick={submit} disabled={busy} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-b from-gold-300 to-gold-500 px-6 py-3.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-navy-950 disabled:opacity-50">{busy ? <><Loader2 size={14} className="animate-spin" /> Uploading {progress}%</> : <><Sparkles size={14} /> Share moment</>}</button></>}
      {error && files.length === 0 && <p className="mt-4 text-xs text-rose-200">{error}</p>}</div></div></div>}
    <input ref={fileRef} type="file" accept="image/*,.heic,.heif" multiple hidden onChange={(e) => { void addFiles(Array.from(e.target.files || [])); e.target.value = ""; }} />
    <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { void addFiles(Array.from(e.target.files || [])); e.target.value = ""; }} />
    <input ref={videoRef} type="file" accept="video/*,.mov,.mp4,.m4v,.hevc,.3gp" capture="environment" hidden onChange={(e) => { void addFiles(Array.from(e.target.files || [])); e.target.value = ""; }} />
  </>;
}

function Preview({ file, url, onRemove }: { file: File; url: string; onRemove: () => void }) {
  const video = isVideo(file);
  return <div className="group relative aspect-square overflow-hidden rounded-xl border border-gold-400/15 bg-navy-950">{video ? <video src={url} muted playsInline className="h-full w-full object-cover" /> : <img src={url} alt="" className="h-full w-full object-cover" />}<span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/80 px-3 pb-2 pt-6 text-[9px] uppercase tracking-wider text-ivory-100/70">{video ? "Video" : "Photo"}</span><button type="button" onClick={onRemove} aria-label="Remove selected file" className="absolute right-2 top-2 rounded-full bg-navy-950/75 p-1.5 text-ivory-50"><X size={13} /></button></div>;
}

function Option({ icon, title, detail, onClick }: { icon: React.ReactNode; title: string; detail: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex w-full items-center gap-4 rounded-xl border border-gold-400/15 bg-navy-950/35 p-4 text-left transition hover:border-gold-300/40 hover:bg-gold-300/5"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-400/20 bg-gold-300/5 text-gold-200">{icon}</span><span><span className="block text-sm text-ivory-50">{title}</span><span className="mt-1 block text-[10px] text-ivory-100/35">{detail}</span></span></button>;
}
