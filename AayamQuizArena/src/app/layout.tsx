import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { ServerWakeup } from "@/components/shared/server-wakeup";

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

export const metadata: Metadata = {
  title: "AAYAM Quiz Arena — Live Real-Time Quiz Platform",
  description: "AAYAM Quiz Arena is the live real-time interactive quiz platform for AAYAM university events.",
  icons: {
    icon: "/LogoGIF.gif",
    shortcut: "/LogoGIF.gif",
    apple: "/LogoGIF.gif",
  },
};

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
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__SOCKET_URL__ = ${JSON.stringify(socketUrl)};`,
          }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-indigo-500/30">
        <ServerWakeup />
        <LoadingScreen />
        {children}
        <Toaster
          position="top-right"
          theme="dark"
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
