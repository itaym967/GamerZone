import type { Metadata } from "next";
import { Suspense } from "react";
import SuccessPageClient from "./success-page-client";

export const metadata: Metadata = {
  title: "Parental Consent",
  description: "Parental consent confirmation page.",
};

export default function ParentalConsentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-primary-foreground" />}>
      <SuccessPageClient />
    </Suspense>
  );
}
