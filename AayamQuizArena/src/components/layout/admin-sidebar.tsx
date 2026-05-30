"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/actions/auth.actions";
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  Play,
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminSidebarProps {
  adminName: string;
  adminEmail: string;
}

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Quizzes", href: "/admin/quizzes", icon: BookOpen },
  { label: "Question Bank", href: "/admin/questions", icon: HelpCircle },
  { label: "Live Sessions", href: "/admin/sessions", icon: Play },
  { label: "Platform Settings", href: "/admin/settings", icon: Settings },
  { label: "Main Admin Panel", href: "/admin/sso-redirect", icon: LayoutDashboard },
  { label: "Back to Main Site", href: process.env.NEXT_PUBLIC_AAYAM_URL || "http://localhost:3000", icon: Globe, isExternal: true },
];

export function AdminSidebar({ adminName, adminEmail }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/") return false;
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-white/10 px-5">
        <Link href="/admin" className="flex items-center gap-2 group">
          <div className="h-10 w-10 overflow-hidden rounded-xl border border-white/20 transition-all duration-200 group-hover:border-indigo-400">
            <img
              src="/Logo.png"
              alt="AAYAM Logo"
              className="h-full w-full object-cover rounded-xl"
            />
          </div>
          <div className="flex flex-col">
            <span className="bg-gradient-to-r from-white to-indigo-300 bg-clip-text text-md font-bold tracking-tight text-transparent transition-all duration-200 group-hover:text-indigo-400 leading-none">
              AAYAM
            </span>
            <span className="text-[8px] text-indigo-400 font-semibold tracking-widest uppercase">
              Quiz Arena
            </span>
          </div>
        </Link>
        <span className="ml-auto rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-indigo-400">
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const classes = cn(
            "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
            active
              ? "bg-indigo-600/15 text-indigo-400 shadow-sm shadow-indigo-500/10"
              : "text-gray-400 hover:bg-white/5 hover:text-white"
          );
          const iconClasses = cn(
            "h-5 w-5 shrink-0 transition-colors",
            active
              ? "text-indigo-400"
              : "text-gray-500 group-hover:text-gray-300"
          );

          if ((item as any).isExternal) {
            return (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={classes}
              >
                <item.icon className={iconClasses} />
                {item.label}
              </a>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={classes}
            >
              <item.icon className={iconClasses} />
              {item.label}
              {active && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Admin info & logout */}
      <div className="border-t border-white/10 p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="h-9 w-9 overflow-hidden rounded-full border border-white/20">
            <img
              src="/Logo.png"
              alt="Admin Profile"
              className="h-full w-full object-cover rounded-full"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">
              {adminName}
            </p>
            <p className="truncate text-xs text-gray-500">{adminEmail}</p>
          </div>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-gray-400 transition-all duration-200 hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#1a1a2e] text-gray-400 transition-colors hover:text-white lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/10 bg-[#0f0f23] lg:block">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Slide-out panel */}
          <aside className="relative h-full w-72 border-r border-white/10 bg-[#0f0f23] shadow-2xl shadow-black/50">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-white"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>

            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
