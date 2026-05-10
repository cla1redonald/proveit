// Server Component: minimal layout wrapper, sets page metadata

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fast Check — ProveIt",
  description: "Three critical assumptions picked for your idea — the ones most likely to kill it. ~15 minutes, no back-and-forth.",
};

export default function FastLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
