// Server Component: minimal layout wrapper, sets page metadata

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Full Validation — ProveIt",
  description: "Full evidence-based product validation. Discovery, research, named methodology, kill signals, and a handoff bundle for engineering and design.",
};

export default function ValidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
