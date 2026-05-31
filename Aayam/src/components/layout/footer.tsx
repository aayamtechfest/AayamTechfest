import Link from "next/link";
import { Mail, Phone, MapPin } from "lucide-react";

function TwitterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function YoutubeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
    </svg>
  );
}

import { getSettings } from "@/actions/settings.actions";

const quickLinks = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Events" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
];

export async function Footer() {
  const settings = await getSettings();
  const footerLogo = settings?.footerLogoUrl || "/LogoGIF.gif";
  const footerText = settings?.footerText || `© ${new Date().getFullYear()} AAYAM. All rights reserved. Built with ❤️ for innovators.`;
  const contactEmail = settings?.contactEmail || "contact@aayam.tech";
  const contactPhone = settings?.contactPhone || "+91 98765 43210";
  const contactAddress = settings?.contactAddress || "University Campus";

  const socialLinksData = settings?.socialLinks as any;
  const instagram = socialLinksData?.instagram || "";
  const github = socialLinksData?.github || "";
  const twitter = socialLinksData?.twitter || "";
  const linkedin = socialLinksData?.linkedin || "";
  const youtube = socialLinksData?.youtube || "";

  const socialLinks = [
    { href: instagram || "", icon: InstagramIcon, label: "Instagram" },
    { href: github || "", icon: GithubIcon, label: "GitHub" },
    { href: twitter || "", icon: TwitterIcon, label: "Twitter" },
    { href: linkedin || "", icon: LinkedinIcon, label: "LinkedIn" },
    { href: youtube || "", icon: YoutubeIcon, label: "YouTube" },
  ].filter(link => link.href && link.href.trim() !== "" && link.href !== "#");

  return (
    <footer className="border-t border-white/10 bg-[#0a0a1a]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Main Footer Content */}
        <div className="grid gap-8 md:grid-cols-3">
          {/* Column 1: Logo & Description */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <div className="h-15 w-15 overflow-hidden rounded-full border border-white/20 transition-all duration-200 group-hover:border-indigo-400">
                <img
                  src={footerLogo}
                  alt="AAYAM Logo"
                  className="h-full w-full object-cover rounded-full"
                />
              </div>
              <span className="gradient-text font-heading text-2xl font-bold">
                AAYAM
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-gray-400">
              The premier university event and hackathon platform.
              Innovate, compete, and build the future with AAYAM.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="mb-4 font-heading text-sm font-semibold uppercase tracking-wider text-gray-300">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors duration-200 hover:text-indigo-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact */}
          <div>
            <h3 className="mb-4 font-heading text-sm font-semibold uppercase tracking-wider text-gray-300">
              Contact
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Mail className="h-4 w-4 text-indigo-400" />
                <span>{contactEmail}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Phone className="h-4 w-4 text-indigo-400" />
                <span>{contactPhone}</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin className="h-4 w-4 text-indigo-400" />
                <span>{contactAddress}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Social Links */}
        {socialLinks.length > 0 && (
          <div className="mt-10 flex items-center justify-center gap-4 border-t border-white/5 pt-8">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-gray-400 transition-all duration-200 hover:bg-indigo-600/20 hover:text-indigo-400"
                aria-label={social.label}
              >
                <social.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        )}

        {/* Copyright */}
        <div className="mt-8 text-center border-t border-white/5 pt-6">
          <p className="text-xs text-gray-500">
            {footerText}
          </p>
        </div>
      </div>
    </footer>
  );
}
