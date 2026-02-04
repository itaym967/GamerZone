import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import { Toaster } from "sonner";
import PWAInstallPrompt from "./components/PWAInstallPrompt";
import OfflineIndicator from "./components/OfflineIndicator";
import FloatingGamerBot from "./components/FloatingGamerBot";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: "GamerZone | Swap Gamertags",
  description: "הפלטפורמה האולטימטיבית לגיימרים בישראל - החלף gamertags, מצא חברים חדשים לסקוואד",
  applicationName: "GamerZone",
  authors: [{ name: "GamerZone Team" }],
  keywords: ["gaming", "gamers", "israel", "gamertag", "swap", "chat", "gaming community"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "GamerZone",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "GamerZone",
    title: "GamerZone | Swap Gamertags",
    description: "הפלטפורמה האולטימטיבית לגיימרים בישראל",
  },
  twitter: {
    card: "summary_large_image",
    title: "GamerZone | Swap Gamertags",
    description: "הפלטפורמה האולטימטיבית לגיימרים בישראל",
  },
};

export const viewport: Viewport = {
  themeColor: "#00ff9d",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body
        className={`${rubik.variable} antialiased font-rubik bg-background text-foreground`}
      >
        <AuthProvider>
          <OfflineIndicator />
          {children}
          <PWAInstallPrompt />
          <FloatingGamerBot />
          <Toaster position="top-center" richColors theme="dark" />
        </AuthProvider>
      </body>
    </html>
  );
}
