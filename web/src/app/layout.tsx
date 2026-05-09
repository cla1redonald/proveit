import type { Metadata } from "next";
import { Playfair_Display, Fira_Code } from "next/font/google";
import "./globals.css";

// Roami Design System fonts.
// Body uses the system-ui stack — no Google import needed.
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const firaCode = Fira_Code({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-fira-code",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ProveIt — Validate your product idea before you build",
  description:
    "Run a rapid market and desirability check on your product idea. Fast Check (90 seconds) or Full Validation with AI-powered research.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${firaCode.variable}`}>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
