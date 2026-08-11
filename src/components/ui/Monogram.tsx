"use client";

export function Monogram({ className = "", animate = false }: { className?: string; animate?: boolean }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="60" cy="60" r="58" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <path
        d="M60 22c-3 6-9 8-9 15 0 5 4 9 9 9s9-4 9-9c0-7-6-9-9-15Z"
        stroke="currentColor"
        strokeWidth="1.4"
        className={animate ? "monogram-draw" : ""}
      />
      <path
        d="M35 50c8-6 17-9 25-9s17 3 25 9"
        stroke="currentColor"
        strokeWidth="1.4"
        className={animate ? "monogram-draw" : ""}
      />
      <path
        d="M30 60c10 14 20 20 30 20s20-6 30-20"
        stroke="currentColor"
        strokeWidth="1.2"
        className={animate ? "monogram-draw" : ""}
      />
      <path
        d="M60 80v18M50 92c4 4 16 4 20 0"
        stroke="currentColor"
        strokeWidth="1.2"
        className={animate ? "monogram-draw" : ""}
      />
      <path
        d="M42 46c4-4 4-10 0-14M78 46c-4-4-4-10 0-14"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.8"
      />
    </svg>
  );
}
