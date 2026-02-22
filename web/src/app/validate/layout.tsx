// Server Component: minimal layout wrapper, sets page metadata

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Full Validation — ProveIt",
  description: "Conversational product validation: discovery, research, and scored findings.",
};

export default function ValidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
