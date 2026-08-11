import type { Metadata } from "next";
import "./globals.css";
import { getSiteSettings } from "@/lib/repo";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const names = settings.coupleNames || "The Royal Wedding";
  return {
    title: `${names} | The Royal Wedding`,
    description:
      settings.heroTagline ||
      "Join us in celebration — a royal wedding uniting two houses, two continents, and one love.",
    openGraph: {
      title: `${names} | The Royal Wedding`,
      description: settings.heroTagline || "Join us in celebration.",
      images: settings.heroImage ? [settings.heroImage] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${names} | The Royal Wedding`,
      description: settings.heroTagline || "Join us in celebration.",
      images: settings.heroImage ? [settings.heroImage] : [],
    },
    icons: { icon: "/favicon.svg" },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router layout, not pages/_document; this rule's heuristic misfires here */}
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=Inter:wght@300..600&family=Great+Vibes&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-navy-950 text-ivory-50">
        {children}
      </body>
    </html>
  );
}
