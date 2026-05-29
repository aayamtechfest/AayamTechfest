"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export function LoadingScreen() {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Show splash screen for at least 5 seconds
    const fadeTimeout = setTimeout(() => {
      setFadeOut(true);
    }, 4700); // Start fade-out slightly before 5s

    const removeTimeout = setTimeout(() => {
      setShow(false);
    }, 5200); // Fully remove from DOM after fade-out transition

    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(removeTimeout);
    };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#070b19] transition-all duration-500 ease-in-out ${
        fadeOut ? "opacity-0 pointer-events-none backdrop-blur-none" : "opacity-100"
      }`}
    >
      <div className="relative flex flex-col items-center">
        {/* Glow effect background */}
        <div className="absolute -inset-4 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
        
        {/* Clickable Rounded Logo Container */}
        <Link
          href="/"
          className="relative block h-60 w-60 overflow-hidden rounded-full border border-white/15 bg-black/40 p-1 shadow-2xl shadow-indigo-500/10 transition-transform hover:scale-105"
        >
          <Image
            src="/LogoGIF.gif"
            alt="AAYAM Logo"
            fill
            priority
            unoptimized
            className="rounded-full object-cover animate-pulse"
          />
        </Link>
      </div>
    </div>
  );
}
