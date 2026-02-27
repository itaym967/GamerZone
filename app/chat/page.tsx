import type { Metadata } from "next";
import { Suspense } from "react";
import ChatPageClient from "./chat-page-client";

export const metadata: Metadata = {
  title: "Chat",
  description: "Chat with friends and teammates on GamerZone.",
};

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-primary-foreground" />}>
      <ChatPageClient />
    </Suspense>
  );
}
