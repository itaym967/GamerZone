import type { Metadata } from "next";
import { Suspense } from "react";
import SuccessPageClient from "./success-page-client";

export const metadata: Metadata = {
  title: "Parental Consent",
  description: "Parental consent confirmation page.",
};

interface ParentalConsentSuccessPageProps {
  searchParams: Promise<{
    already?: string;
  }>;
}

export default async function ParentalConsentSuccessPage({
  searchParams,
}: ParentalConsentSuccessPageProps) {
  const resolvedSearchParams = await searchParams;
  const alreadyGranted = resolvedSearchParams.already === "true";

  return (
    <Suspense fallback={<div className="min-h-screen bg-primary-foreground" />}>
      <SuccessPageClient alreadyGranted={alreadyGranted} />
    </Suspense>
  );
}
