// Server Component: minimal layout wrapper, sets page metadata

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fast Check — ProveIt",
  description: "Rapid assumption check: three verdicts on your idea in under 90 seconds.",
};

export default function FastLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
