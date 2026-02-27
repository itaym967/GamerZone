import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Onboarding",
  description: "Complete your GamerZone profile setup.",
};

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
