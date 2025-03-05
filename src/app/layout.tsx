
import "./globals.css"
import { Providers } from "./Providers"
import { Toaster } from "@/components/ui/sonner"

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rideshareappweb.netlify.app" // Fallback URL
const ogImageUrl = `${siteUrl}/og-image.png`
const twitterImageUrl = `${siteUrl}/twitter-image.png`

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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Toaster closeButton richColors position="top-right"/>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

export const viewport = {
  themeColor: "#f97316",
}

