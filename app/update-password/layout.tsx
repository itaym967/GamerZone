import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Update Password",
  description: "Set a new password for your GamerZone account.",
};

export default function UpdatePasswordLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
