import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Chat",
  description: "Chat with friends and teammates on GamerZone.",
};

export default function ChatLayout({ children }: { children: ReactNode }) {
  return children;
}
