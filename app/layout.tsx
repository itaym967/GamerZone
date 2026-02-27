import type { Metadata, Viewport } from "next";
import { Rubik } from "next/font/google";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/auth-context";
import FloatingGamerBot from "./components/floating-gamer-bot";
import KeyboardHandler from "./components/keyboard-handler";
import OfflineIndicator from "./components/offline-indicator";
import PWAInstallPrompt from "./components/pwa-install-prompt";
import SafetyBanner from "./components/safety-banner";
import SplashScreen from "./components/splash-screen";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["hebrew", "latin"],
});

export const metadata: Metadata = {
  title: "GamerZone | Swap Gamertags",
  description:
    "הפלטפורמה האולטימטיבית לגיימרים בישראל - החלף gamertags, מצא חברים חדשים לסקוואד",
  applicationName: "GamerZone",
  authors: [{ name: "GamerZone Team" }],
  keywords: [
    "gaming",
    "gamers",
    "israel",
    "gamertag",
    "swap",
    "chat",
    "gaming community",
  ],
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
    <html dir="rtl" lang="he" suppressHydrationWarning>
      <head>
        <link href="/manifest.json" rel="manifest" />
        {/* Apple Touch Icons - multiple sizes for different devices */}
        <link href="/icons/icon-192x192.svg" rel="apple-touch-icon" />
        <link
          href="/icons/icon-152x152.svg"
          rel="apple-touch-icon"
          sizes="152x152"
        />
        <link
          href="/icons/icon-144x144.svg"
          rel="apple-touch-icon"
          sizes="144x144"
        />
        <link
          href="/icons/icon-128x128.svg"
          rel="apple-touch-icon"
          sizes="128x128"
        />
        <meta content="yes" name="mobile-web-app-capable" />
        <meta content="yes" name="apple-mobile-web-app-capable" />
        <meta
          content="black-translucent"
          name="apple-mobile-web-app-status-bar-style"
        />
        <meta content="GamerZone" name="apple-mobile-web-app-title" />
      </head>
      <body
        className={`${rubik.variable} bg-background font-rubik text-foreground antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <SplashScreen />
          <KeyboardHandler />
          <OfflineIndicator />
          <SafetyBanner />
          {children}
          <PWAInstallPrompt />
          <FloatingGamerBot />
          <Toaster position="top-center" richColors theme="dark" />
        </AuthProvider>
      </body>
    </html>
  );
}
