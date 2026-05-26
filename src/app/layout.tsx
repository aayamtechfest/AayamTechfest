import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

import { LoadingScreen } from "@/components/shared/loading-screen";

export const metadata: Metadata = {
  title: "AAYAM - University Event & Hackathon Platform",
  description:
    "AAYAM is the ultimate university event and hackathon management platform. Discover events, register your team, and compete to innovate.",

  verification: {
    google: "-tLV5LGzklIMBfcWQzZMSEMgq4uT35lAkcimmIBuXtw",
  },

  keywords: [
    "AAYAM",
    "hackathon",
    "university events",
    "tech fest",
    "coding competition",
  ],

  openGraph: {
    title: "AAYAM - University Event & Hackathon Platform",
    description:
      "AAYAM is the ultimate university event and hackathon management platform. Discover events, register your team, and compete to innovate.",
    url: "/",
    siteName: "AAYAM",
    type: "website",
  },

  icons: {
    icon: "/Logo.png",
    shortcut: "/Logo.png",
    apple: "/Logo.png",
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} dark`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-background text-foreground antialiased">
  <LoadingScreen />
  {children}

  <Toaster
    position="top-right"
    theme="dark"
    richColors
    closeButton
  />

  <Script
    src="https://www.googletagmanager.com/gtag/js?id=G-7LNPV0D7NN"
    strategy="afterInteractive"
  />

  <Script id="google-analytics" strategy="afterInteractive">
    {`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-7LNPV0D7NN');
    `}
  </Script>
</body>
    </html>
  );
}
