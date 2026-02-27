import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create your GamerZone account.",
};

export default function SignupLayout({ children }: { children: ReactNode }) {
  return children;
}
