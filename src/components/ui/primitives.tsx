import { ButtonHTMLAttributes, ReactNode } from "react";

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 justify-center">
      <span className="h-px w-8 bg-gradient-to-r from-transparent to-emerald-400/80" />
      <span className="font-display italic tracking-[0.35em] text-[11px] sm:text-xs uppercase text-gold-300">
        {children}
      </span>
      <span className="h-px w-8 bg-gradient-to-l from-transparent to-emerald-400/80" />
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  light,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  light?: boolean;
}) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2
        className={`mt-4 text-4xl sm:text-5xl font-display font-medium ${
          light ? "text-navy-950" : "text-ivory-50"
        }`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-sm sm:text-base leading-relaxed ${light ? "text-navy-800/80" : "text-ivory-100/70"}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`gold-shimmer inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gradient-to-b from-gold-300 to-gold-500 text-navy-950 font-medium text-xs tracking-[0.2em] uppercase rounded-sm shadow-[0_4px_24px_rgba(201,162,75,0.25)] hover:shadow-[0_6px_30px_rgba(201,162,75,0.4)] transition-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-300 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-emerald-400/70 text-emerald-200 font-medium text-xs tracking-[0.2em] uppercase rounded-sm hover:bg-emerald-500/15 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
