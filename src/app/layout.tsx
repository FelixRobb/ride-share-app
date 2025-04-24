import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { Toaster } from "@/components/ui/sonner";

import { Providers } from "./Providers";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rideshareappweb.netlify.app"; // Fallback URL
const ogImageUrl = `${siteUrl}/og-image.png`;
const twitterImageUrl = `${siteUrl}/twitter-image.png`;

export const metadata = {
  title: "RideShare",
  description: "Connect with friends, share rides, and travel together safely.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "RideShare",
  },
  openGraph: {
    title: "RideShare",
    description: "Connect with friends, share rides, and travel together safely.",
    url: siteUrl,
    siteName: "RideShare",
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Illustration of ride-sharing.",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "RideShare",
    description: "Connect with friends, share rides, and travel together safely.",
    images: [twitterImageUrl],
  },
  metadataBase: new URL(siteUrl),
  verification: {
    google: "W9GFmL7Uxf4V2KqhH-IFNgbJHdrHziVtC95mXXGPwI0",
  },
};

export const viewport = {
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <Toaster closeButton richColors position="top-right" />
          {children}
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  );
}
