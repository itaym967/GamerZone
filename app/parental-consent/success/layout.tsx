import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Parental Consent",
  description: "Parental consent confirmation page.",
};

export default function ParentalConsentSuccessLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
