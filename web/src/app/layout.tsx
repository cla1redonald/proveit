import type { Metadata } from "next";
import { Playfair_Display, Fira_Code } from "next/font/google";
import "./globals.css";
import PostHogProvider from "@/components/PostHogProvider";

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
    "The PM validation tool that tells you when your idea is bad. Fast Check in 15 minutes, or Full Validation with evidence, named methodology, and kill signals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${firaCode.variable}`}>
      <body className="min-h-screen">
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
