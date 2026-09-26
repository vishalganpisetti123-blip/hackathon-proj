import type { Metadata } from "next";

import { SiteHeader } from "@/components/fieldproof/SiteHeader";

import "./globals.css";

export const metadata: Metadata = {
  title: "FieldProof — Code-switching and spelling by ear",
  description: "Local multilingual speech transcription with language detection, word-level review, and a choice of presentation language.",
  icons: { icon: "/fieldproof.svg" },
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
