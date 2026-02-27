import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Party Details",
  description: "View and manage a party in GamerZone.",
};

export default function PartyDetailsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
