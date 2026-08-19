"use client";

import React, {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Camera,
  Check,
  Heart,
  Image as ImageIcon,
  MoreHorizontal,
  Play,
  Plus,
  Sparkles,
  Upload,
  Video,
  X,
} from "lucide-react";

type MediaType = "image" | "video";

type MediaItem = {
  id: string;
  type: MediaType;
  url: string;
  thumbnailUrl?: string;
  duration?: number;
};

type Post = {
  id: string;
  authorName: string;
  caption?: string;
  media: MediaItem[];
  createdAt: string;
  likes: number;
};

const MAX_VIDEO_DURATION = 120;
const MAX_FILE_SIZE = 200 * 1024 * 1024;

export default function PhotosPage() {
  const [coupleNames, setCoupleNames] = useState("Ellis & Monique");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [composerOpen, setComposerOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [caption, setCaption] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [viewerPost, setViewerPost] = useState<Post | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  async function loadPosts() {
    try {
      setLoading(true);

      const response = await fetch("/api/photos", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to load the Royal Wall.");
      }

      const data = await response.json();

      setCoupleNames(data.coupleNames || "Ellis & Monique");
      setPosts(data.posts || data.photos || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function openComposer() {
    setComposerOpen(true);
    setUploadError("");
    setUploadComplete(false);
  }

  function closeComposer() {
    if (uploading) return;

    previewUrls.forEach((url) => URL.revokeObjectURL(url));

    setSelectedFiles([]);
    setPreviewUrls([]);
    setCaption("");
    setUploadProgress(0);
    setUploadError("");
    setUploadComplete(false);
    setComposerOpen(false);
  }

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const files = Array.from(event.target.files || []);

    event.target.value = "";

    if (!files.length) return;

    await validateAndAddFiles(files);
  }

  async function validateAndAddFiles(files: File[]) {
    setUploadError("");

    const validFiles: File[] = [];

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setUploadError(
          `${file.name} is larger than 200MB and cannot be uploaded.`
        );
        continue;
      }

      if (
        !file.type.startsWith("image/") &&
        !file.type.startsWith("video/")
      ) {
        setUploadError(
          `${file.name} is not a supported image or video.`
        );
        continue;
      }

      if (file.type.startsWith("video/")) {
        try {
          const duration = await getVideoDuration(file);

          if (duration > MAX_VIDEO_DURATION) {
            setUploadError(
              `${file.name} is longer than 2 minutes. Videos must be 2 minutes or less.`
            );
            continue;
          }
        } catch {
          setUploadError(`Unable to read ${file.name}.`);
          continue;
        }
      }

      validFiles.push(file);
    }

    if (!validFiles.length) return;

    const urls = validFiles.map((file) =>
      URL.createObjectURL(file)
    );

    setSelectedFiles((current) => [...current, ...validFiles]);
    setPreviewUrls((current) => [...current, ...urls]);
  }

  function removeFile(index: number) {
    const url = previewUrls[index];

    if (url) {
      URL.revokeObjectURL(url);
    }

    setSelectedFiles((current) =>
      current.filter((_, i) => i !== index)
    );

    setPreviewUrls((current) =>
      current.filter((_, i) => i !== index)
    );
  }

  function getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const url = URL.createObjectURL(file);

      video.preload = "metadata";

      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);

        if (Number.isFinite(video.duration)) {
          resolve(video.duration);
        } else {
          reject(new Error("Invalid video duration."));
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Could not read video."));
      };

      video.src = url;
    });
  }

  async function uploadPost() {
    if (!selectedFiles.length) {
      setUploadError("Choose at least one photo or video.");
      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      setUploadProgress(0);

      const formData = new FormData();

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      formData.append("caption", caption);

      const xhr = new XMLHttpRequest();

      await new Promise<void>((resolve, reject) => {
        xhr.open("POST", "/api/photos/upload");

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadProgress(
              Math.round((event.loaded / event.total) * 100)
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error("Upload failed."));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network error."));
        };

        xhr.send(formData);
      });

      setUploadProgress(100);
      setUploadComplete(true);

      await loadPosts();

      setTimeout(() => {
        closeComposer();
      }, 1200);
    } catch (error) {
      console.error(error);

      setUploadError(
        "Something went wrong while posting your moment. Please try again."
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#07101D] text-[#F8F5ED]">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#07101D]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[70px] max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8B66C]/30 bg-[#D8B66C]/[0.04]">
              <Sparkles
                size={15}
                className="text-[#D8B66C]"
              />
            </div>

            <div>
              <p className="font-serif text-sm italic text-[#E7CF99]">
                {coupleNames}
              </p>

              <p className="text-[9px] uppercase tracking-[0.3em] text-white/30">
                The Royal Wall
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openComposer}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8B66C]/25 bg-[#D8B66C]/10 text-[#E7CF99] transition hover:bg-[#D8B66C]/20"
              aria-label="Share a moment"
            >
              <Plus size={16} />
            </button>

            <Link
              href="/"
              className="hidden items-center gap-2 rounded-full border border-white/[0.07] px-4 py-2 text-[9px] uppercase tracking-[0.18em] text-white/40 transition hover:text-white sm:flex"
            >
              <ArrowLeft size={13} />
              Back
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 sm:px-6">
        {/* HERO */}
        <section className="mx-auto max-w-2xl py-14 text-center sm:py-20">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#D8B66C]/15 bg-[#D8B66C]/[0.04] px-4 py-2">
            <Sparkles
              size={11}
              className="text-[#D8B66C]"
            />

            <span className="text-[9px] uppercase tracking-[0.3em] text-[#D8B66C]">
              The Celebration
            </span>
          </div>

          <h1 className="font-serif text-4xl font-medium tracking-tight text-[#FAF7EF] sm:text-6xl">
            The Royal Wall
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-white/40">
            Share the photographs and videos that make this
            celebration unforgettable.
          </p>

          <button
            type="button"
            onClick={openComposer}
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#E7CF99] px-6 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#07101D] transition hover:bg-[#F1DFB4]"
          >
            <Camera size={14} />
            Share a moment
          </button>
        </section>

        {/* FEED */}
        <section className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="font-serif text-xl italic text-[#E7CF99]">
                From the guests
              </p>

              <p className="mt-1 text-[9px] uppercase tracking-[0.22em] text-white/25">
                Live from the celebration
              </p>
            </div>

            <button
              type="button"
              onClick={openComposer}
              className="hidden items-center gap-2 rounded-full border border-white/[0.08] px-4 py-2 text-[9px] uppercase tracking-[0.18em] text-white/40 transition hover:border-[#D8B66C]/25 hover:text-[#E7CF99] sm:flex"
            >
              <Upload size={11} />
              Post
            </button>
          </div>

          {loading ? (
            <FeedSkeleton />
          ) : posts.length === 0 ? (
            <EmptyState onPost={openComposer} />
          ) : (
            <div className="space-y-8">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onOpen={() => setViewerPost(post)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* MOBILE ACTION */}
      <button
        type="button"
        onClick={openComposer}
        className="fixed bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#E7CF99] px-5 py-3.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#07101D] shadow-2xl shadow-black/40 sm:hidden"
      >
        <Camera size={14} />
        Share moment
      </button>

      {/* UPLOAD SHEET */}
      {composerOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={closeComposer}
          />

          <div className="absolute inset-x-0 bottom-0 mx-auto max-h-[92vh] max-w-2xl overflow-y-auto rounded-t-[30px] border border-white/[0.08] bg-[#0A1624] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-[#0A1624]/95 px-5 py-4 backdrop-blur-xl">
              <div>
                <p className="font-serif text-lg italic text-[#E7CF99]">
                  Share your moment
                </p>

                <p className="mt-1 text-[9px] uppercase tracking-[0.22em] text-white/25">
                  Photos and videos from the celebration
                </p>
              </div>

              <button
                type="button"
                disabled={uploading}
                onClick={closeComposer}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] text-white/45 transition hover:text-white disabled:opacity-30"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              {uploadComplete ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#D8B66C]/20 bg-[#D8B66C]/10 text-[#E7CF99]">
                    <Check size={27} />
                  </div>

                  <h3 className="mt-5 font-serif text-2xl text-white">
                    Moment shared
                  </h3>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-white/35">
                    Your post is now part of the Royal Wall.
                  </p>
                </div>
              ) : selectedFiles.length === 0 ? (
                <div className="space-y-3">
                  <UploadOption
                    icon={<Camera size={19} />}
                    title="Take a photo"
                    description="Open your camera"
                    onClick={() =>
                      cameraInputRef.current?.click()
                    }
                  />

                  <UploadOption
                    icon={<ImageIcon size={19} />}
                    title="Choose photos"
                    description="Select images from your device"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                  />

                  <UploadOption
                    icon={<Video size={19} />}
                    title="Choose a video"
                    description="Videos can be up to 2 minutes"
                    onClick={() =>
                      videoInputRef.current?.click()
                    }
                  />

                  {uploadError && (
                    <ErrorMessage message={uploadError} />
                  )}
                </div>
              ) : (
                <>
                  {/* PREVIEWS */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {previewUrls.map((url, index) => {
                      const file = selectedFiles[index];
                      const isVideo =
                        file?.type.startsWith("video/");

                      return (
                        <div
                          key={`${file?.name}-${index}`}
                          className="group relative aspect-square overflow-hidden rounded-2xl border border-white/[0.08] bg-black"
                        >
                          {isVideo ? (
                            <video
                              src={url}
                              muted
                              playsInline
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <img
                              src={url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}

                          <div className="absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-gradient-to-t from-black/70 to-transparent px-3 pb-3 pt-8 text-white/75">
                            {isVideo ? (
                              <Video size={11} />
                            ) : (
                              <ImageIcon size={11} />
                            )}

                            <span className="text-[8px] uppercase tracking-[0.15em]">
                              {isVideo ? "Video" : "Photo"}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className="aspect-square rounded-2xl border border-dashed border-white/[0.12] text-white/30 transition hover:border-[#D8B66C]/30 hover:text-[#E7CF99]"
                    >
                      <Plus
                        size={20}
                        className="mx-auto"
                      />

                      <span className="mt-2 block text-[9px] uppercase tracking-[0.18em]">
                        Add more
                      </span>
                    </button>
                  </div>

                  {/* CAPTION */}
                  <div className="mt-6">
                    <label className="mb-2 block text-[9px] uppercase tracking-[0.2em] text-white/30">
                      Caption
                    </label>

                    <textarea
                      value={caption}
                      onChange={(event) =>
                        setCaption(event.target.value)
                      }
                      rows={3}
                      maxLength={500}
                      placeholder="Say something about this moment..."
                      className="w-full resize-none rounded-2xl border border-white/[0.08] bg-white/[0.025] px-4 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-[#D8B66C]/30"
                    />

                    <div className="mt-1 text-right text-[9px] text-white/20">
                      {caption.length}/500
                    </div>
                  </div>

                  {uploadProgress > 0 && (
                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-[9px] uppercase tracking-[0.18em] text-white/35">
                        <span>Uploading</span>
                        <span>{uploadProgress}%</span>
                      </div>

                      <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-[#D8B66C] transition-all"
                          style={{
                            width: `${uploadProgress}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {uploadError && (
                    <ErrorMessage message={uploadError} />
                  )}

                  <button
                    type="button"
                    onClick={uploadPost}
                    disabled={uploading}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#E7CF99] px-6 py-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#07101D] transition hover:bg-[#F1DFB4] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploading ? (
                      `Uploading ${uploadProgress}%`
                    ) : (
                      <>
                        <Sparkles size={14} />
                        Share moment
                      </>
                    )}
                  </button>

                  <p className="mt-3 text-center text-[9px] leading-5 text-white/20">
                    Photos and videos are visible to guests on the
                    Royal Wall. Maximum video length is 2 minutes.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN VIEWER */}
      {viewerPost && (
        <MediaViewer
          post={viewerPost}
          onClose={() => setViewerPost(null)}
        />
      )}

      {/* FILE INPUTS */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFileChange}
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handleFileChange}
      />

      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        hidden
        onChange={handleFileChange}
      />
    </div>
  );
}

function PostCard({
  post,
  onOpen,
}: {
  post: Post;
  onOpen: () => void;
}) {
  const [liked, setLiked] = useState(false);
  const [activeMedia, setActiveMedia] = useState(0);

  const media = post.media[activeMedia];
  const likeCount = post.likes + (liked ? 1 : 0);

  return (
    <article className="overflow-hidden rounded-[26px] border border-white/[0.06] bg-[#0A1624] shadow-2xl shadow-black/10">
      {/* POST HEADER */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D8B66C]/20 bg-[#D8B66C]/[0.06] font-serif text-sm italic text-[#E7CF99]">
            {post.authorName.charAt(0).toUpperCase()}
          </div>

          <div>
            <p className="text-xs font-medium text-white/85">
              {post.authorName}
            </p>

            <p className="mt-0.5 text-[9px] uppercase tracking-[0.16em] text-white/25">
              {formatRelativeTime(post.createdAt)}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="text-white/25 transition hover:text-white/60"
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      {/* MEDIA */}
      <div className="relative bg-black">
        <button
          type="button"
          onClick={onOpen}
          className="block w-full"
        >
          {media.type === "video" ? (
            <div className="relative">
              <video
                src={media.url}
                poster={media.thumbnailUrl}
                controls={false}
                muted
                playsInline
                preload="metadata"
                className="aspect-[4/5] w-full object-cover"
              />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md">
                  <Play
                    size={21}
                    fill="currentColor"
                  />
                </div>
              </div>

              {media.duration !== undefined && (
                <span className="absolute bottom-4 right-4 rounded-full bg-black/55 px-2.5 py-1 text-[9px] text-white/75 backdrop-blur-md">
                  {formatDuration(media.duration)}
                </span>
              )}
            </div>
          ) : (
            <img
              src={media.url}
              alt={post.caption || "Wedding moment"}
              className="aspect-[4/5] w-full object-cover"
            />
          )}
        </button>

        {/* CAROUSEL CONTROLS */}
        {post.media.length > 1 && (
          <>
            {activeMedia > 0 && (
              <button
                type="button"
                onClick={() =>
                  setActiveMedia((current) => current - 1)
                }
                className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md"
              >
                <ArrowLeft size={15} />
              </button>
            )}

            {activeMedia < post.media.length - 1 && (
              <button
                type="button"
                onClick={() =>
                  setActiveMedia((current) => current + 1)
                }
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md"
              >
                <ArrowLeft
                  size={15}
                  className="rotate-180"
                />
              </button>
            )}

            <div className="absolute left-1/2 top-4 flex -translate-x-1/2 gap-1.5 rounded-full bg-black/35 px-2.5 py-1.5 backdrop-blur-md">
              {post.media.map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 w-1.5 rounded-full ${
                    index === activeMedia
                      ? "bg-white"
                      : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* POST CONTENT */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setLiked((current) => !current)}
            className={`flex items-center gap-1.5 transition ${
              liked
                ? "text-[#E7CF99]"
                : "text-white/45 hover:text-white"
            }`}
          >
            <Heart
              size={18}
              fill={liked ? "currentColor" : "none"}
            />

            <span className="text-xs">
              {likeCount}
            </span>
          </button>

          {post.media.length > 1 && (
            <span className="text-[9px] uppercase tracking-[0.18em] text-white/20">
              {post.media.length} moments
            </span>
          )}
        </div>

        {post.caption && (
          <p className="mt-3 text-sm leading-6 text-white/60">
            <span className="mr-1 font-medium text-white/85">
              {post.authorName}
            </span>
            {post.caption}
          </p>
        )}
      </div>
    </article>
  );
}

function MediaViewer({
  post,
  onClose,
}: {
  post: Post;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const media = post.media[index];

  return (
    <div className="fixed inset-0 z-[70] bg-black">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md"
      >
        <X size={18} />
      </button>

      <div className="flex h-full items-center justify-center p-4 sm:p-10">
        <div className="relative flex h-full w-full max-w-6xl items-center justify-center">
          {media.type === "video" ? (
            <video
              key={media.id}
              src={media.url}
              poster={media.thumbnailUrl}
              controls
              autoPlay
              playsInline
              className="max-h-full max-w-full rounded-2xl object-contain"
            />
          ) : (
            <img
              key={media.id}
              src={media.url}
              alt={post.caption || "Wedding moment"}
              className="max-h-full max-w-full rounded-2xl object-contain"
            />
          )}

          {post.media.length > 1 && (
            <>
              {index > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setIndex((current) => current - 1)
                  }
                  className="absolute left-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md sm:left-6"
                >
                  <ArrowLeft size={18} />
                </button>
              )}

              {index < post.media.length - 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setIndex((current) => current + 1)
                  }
                  className="absolute right-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md sm:right-6"
                >
                  <ArrowLeft
                    size={18}
                    className="rotate-180"
                  />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-black/60 px-5 py-4 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-white">
                {post.authorName}
              </p>

              {post.caption && (
                <p className="mt-1 text-sm text-white/55">
                  {post.caption}
                </p>
              )}
            </div>

            {post.media.length > 1 && (
              <span className="text-[9px] uppercase tracking-[0.18em] text-white/30">
                {index + 1} / {post.media.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UploadOption({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-4 text-left transition hover:border-[#D8B66C]/25 hover:bg-[#D8B66C]/[0.04]"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#D8B66C]/20 bg-[#D8B66C]/[0.05] text-[#E7CF99]">
        {icon}
      </div>

      <div>
        <p className="text-sm font-medium text-white/90">
          {title}
        </p>

        <p className="mt-1 text-[10px] text-white/30">
          {description}
        </p>
      </div>
    </button>
  );
}

function EmptyState({
  onPost,
}: {
  onPost: () => void;
}) {
  return (
    <div className="rounded-[28px] border border-dashed border-white/[0.09] bg-white/[0.015] px-6 py-20 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#D8B66C]/20 bg-[#D8B66C]/[0.05] text-[#D8B66C]">
        <Camera size={20} />
      </div>

      <h3 className="mt-5 font-serif text-2xl text-white">
        Nothing here yet.
      </h3>

      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-white/35">
        Be the first to share a photograph or video from the
        celebration.
      </p>

      <button
        type="button"
        onClick={onPost}
        className="mt-6 rounded-full bg-[#E7CF99] px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-[#07101D]"
      >
        Share the first moment
      </button>
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-8">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="overflow-hidden rounded-[26px] border border-white/[0.06] bg-[#0A1624]"
        >
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="h-9 w-9 animate-pulse rounded-full bg-white/[0.05]" />

            <div className="space-y-2">
              <div className="h-2.5 w-20 animate-pulse rounded-full bg-white/[0.05]" />
              <div className="h-2 w-12 animate-pulse rounded-full bg-white/[0.04]" />
            </div>
          </div>

          <div className="aspect-[4/5] animate-pulse bg-white/[0.025]" />

          <div className="space-y-3 p-5">
            <div className="h-3 w-12 animate-pulse rounded-full bg-white/[0.05]" />
            <div className="h-3 w-56 animate-pulse rounded-full bg-white/[0.05]" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorMessage({
  message,
}: {
  message: string;
}) {
  return (
    <div className="mt-4 rounded-2xl border border-red-400/15 bg-red-400/[0.05] px-4 py-3 text-xs leading-5 text-red-200/75">
      {message}
    </div>
  );
}

function formatRelativeTime(date: string) {
  const timestamp = new Date(date).getTime();

  if (!Number.isFinite(timestamp)) {
    return "Just now";
  }

  const diff = Date.now() - timestamp;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Just now";

  if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes} ${minutes === 1 ? "min" : "mins"} ago`;
  }

  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours} ${hours === 1 ? "hr" : "hrs"} ago`;
  }

  const days = Math.floor(diff / day);

  if (days < 7) {
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }

  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
  }).format(new Date(date));
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${minutes}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
}