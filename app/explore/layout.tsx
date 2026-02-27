import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Explore",
  description: "Discover gamers on GamerZone.",
};

export default function ExploreLayout({ children }: { children: ReactNode }) {
  return children;
}
