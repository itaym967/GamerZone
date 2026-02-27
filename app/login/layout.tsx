import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to GamerZone.",
};

export default function LoginLayout({ children }: { children: ReactNode }) {
  return children;
}
