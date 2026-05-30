"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Trophy } from "lucide-react";
import { getSettings } from "@/actions/settings.actions";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/join", label: "Join Quiz" },
  { href: "/admin", label: "Admin Panel" },
  { href: process.env.NEXT_PUBLIC_AAYAM_URL || "http://localhost:3000", label: "Main Website", isExternal: true },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState("/LogoGIF.gif");
  const [headerLogoUrl, setHeaderLogoUrl] = useState("/RKDF-LOGO.png");

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    async function loadBranding() {
      try {
        const settings = await getSettings();
        if (settings?.logoUrl) setLogoUrl(settings.logoUrl);
        if (settings?.headerLogoUrl) setHeaderLogoUrl(settings.headerLogoUrl);
      } catch (err) {
        console.error("Failed to load header branding settings:", err);
      }
    }
    loadBranding();
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "glass-strong shadow-lg shadow-black/20 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2">
            <div className="h-10 w-10 sm:h-12 sm:w-12 overflow-hidden rounded-full border border-white/10 bg-black/20">
              <img
                src={logoUrl}
                alt="AAYAM Logo"
                className="h-full w-full object-cover rounded-full"
              />
            </div>
            <div className="flex flex-col">
              <span className="gradient-text font-heading text-xl md:text-2xl font-bold tracking-tight leading-none">
                AAYAM
              </span>
              <span className="text-[10px] text-indigo-400 font-medium tracking-wider uppercase">
                Quiz Arena
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => {
              const classes = "relative text-sm font-medium text-gray-300 transition-colors duration-200 hover:text-white after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-indigo-500 after:transition-all after:duration-300 hover:after:w-full";
              if ((link as any).isExternal) {
                return (
                  <a key={link.href} href={link.href} className={classes}>
                    {link.label}
                  </a>
                );
              }
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={classes}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Desktop CTA */}
            <div className="hidden md:block">
              <Link
                href="/join"
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:shadow-indigo-500/40 hover:brightness-110"
              >
                <Trophy className="h-4 w-4" />
                Join Lobby
              </Link>
            </div>

            {/* RKDF Logo */}
            <img
              src={headerLogoUrl}
              alt="RKDF Logo"
              className="hidden md:block h-12 w-auto object-contain opacity-90"
            />

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:text-white md:hidden"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Slide-out Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-[#1a1a2e] shadow-2xl transition-all duration-300 ease-in-out md:hidden ${
          isMobileMenuOpen
            ? "translate-x-0 opacity-100 pointer-events-auto"
            : "translate-x-full opacity-0 pointer-events-none invisible"
        }`}
      >
        <div className="flex h-full flex-col justify-between p-6 pt-20">
          <div className="flex flex-col">
            {/* Close button inside panel */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute top-5 right-5 rounded-lg p-2 text-gray-400 hover:text-white"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>

            <nav className="flex flex-col gap-4">
              {navLinks.map((link) => {
                const classes = "rounded-lg px-4 py-3 text-lg font-medium text-gray-300 transition-colors hover:bg-white/5 hover:text-white";
                if ((link as any).isExternal) {
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={classes}
                    >
                      {link.label}
                    </a>
                  );
                }
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={classes}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile CTA */}
            <div className="mt-8">
              <Link
                href="/join"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:shadow-indigo-500/40 hover:brightness-110"
              >
                Join Lobby
              </Link>
            </div>
          </div>

          {/* Sponsored Badge */}
          <div className="mt-auto pt-6 border-t border-white/10 flex flex-col items-center gap-2">
            <img
              src={headerLogoUrl}
              alt="RKDF Logo"
              className="h-8 w-auto object-contain opacity-80"
            />
            <span className="text-[9px] text-gray-500 uppercase tracking-widest font-semibold">
              Sponsored By RKDF
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
