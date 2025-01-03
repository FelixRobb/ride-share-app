import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rideshareappweb.netlify.app"; // Fallback URL
const ogImageUrl = `${siteUrl}/og-image.png`;
const twitterImageUrl = `${siteUrl}/twitter-image.png`;

export const metadata = {
  title: 'RideShare',
  description: 'Connect with friends, share rides, and travel together safely.',
  openGraph: {
    title: 'RideShare',
    description: 'Connect with friends, share rides, and travel together safely.',
    url: siteUrl,
    siteName: 'RideShare',
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: 'Illustration of ride-sharing.',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RideShare',
    description: 'Connect with friends, share rides, and travel together safely.',
    images: [twitterImageUrl],
  },
  metadataBase: new URL(siteUrl),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
