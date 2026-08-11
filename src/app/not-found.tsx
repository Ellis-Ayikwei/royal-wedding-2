import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-navy-950 text-center">
      <div className="absolute inset-0 pattern-dots opacity-[0.04]" />
      <div className="relative max-w-md">
        <p className="font-display italic text-xs tracking-[0.35em] uppercase text-gold-300">
          Not Found
        </p>
        <h1 className="mt-4 font-display text-4xl text-ivory-50">This invitation could not be found</h1>
        <p className="mt-4 text-sm text-ivory-100/60 leading-relaxed">
          The link may have been regenerated or mistyped. Check with the couple for your current
          invitation link, or visit the main celebration page.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center px-6 py-3 border border-gold-300/60 text-gold-200 text-xs tracking-[0.2em] uppercase rounded-sm hover:bg-gold-300/10 transition-colors"
        >
          Go to the wedding site
        </Link>
      </div>
    </div>
  );
}
