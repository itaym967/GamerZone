import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your GamerZone profile.",
};

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return children;
}
