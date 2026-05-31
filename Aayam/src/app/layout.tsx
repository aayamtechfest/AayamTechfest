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
import { ServerWakeup } from "@/components/shared/server-wakeup";
import { getSettings } from "@/actions/settings.actions";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSettings();
    const title = settings?.eventTitle || "AAYAM - University Event & Hackathon Platform";
    const siteName = settings?.siteName || "AAYAM";
    const description = settings?.tagline || "AAYAM is the ultimate university event and hackathon management platform.";
    const favicon = settings?.faviconUrl || "/LogoGIF.gif";

    return {
      title,
      description,
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
        title,
        description,
        url: "/",
        siteName,
        type: "website",
      },
      icons: {
        icon: favicon,
        shortcut: favicon,
        apple: favicon,
      },
    };
  } catch (error) {
    console.error("Failed to generate metadata dynamically:", error);
    return {
      title: "AAYAM - University Event & Hackathon Platform",
      description: "AAYAM is the ultimate university event and hackathon management platform.",
      verification: {
        google: "-tLV5LGzklIMBfcWQzZMSEMgq4uT35lAkcimmIBuXtw",
      },
      icons: {
        icon: "/LogoGIF.gif",
        shortcut: "/LogoGIF.gif",
        apple: "/LogoGIF.gif",
      },
    };
  }
}
import { prisma } from "@/lib/prisma";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch custom socket URL overriding env variable if set
  const settings = await prisma.settings.findFirst().catch(() => null);
  const socketUrl = settings?.socketUrl || process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";

  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} dark`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__SOCKET_URL__ = ${JSON.stringify(socketUrl)};`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ServerWakeup />
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
