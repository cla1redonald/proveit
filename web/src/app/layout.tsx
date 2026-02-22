import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
