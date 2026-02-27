import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Create LFG Post",
  description: "Publish a looking-for-group post on GamerZone.",
};

export default function LfgCreateLayout({ children }: { children: ReactNode }) {
  return children;
}
