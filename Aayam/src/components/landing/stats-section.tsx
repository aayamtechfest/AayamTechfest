"use client";

import { useEffect, useState, useRef } from "react";
import { Users, Calendar, Trophy, UploadCloud } from "lucide-react";

interface StatItemProps {
  icon: any;
  value: number;
  suffix?: string;
  label: string;
  color: string;
}

function StatItem({ icon: Icon, value, suffix = "+", label, color }: StatItemProps) {
  const [count, setCount] = useState(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );
    if (elementRef.current) observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || value === 0) return;
    let start = 0;
    const duration = 1500;
    const increment = Math.max(1, Math.ceil(value / (duration / 16)));

    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setCount(value);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value, isVisible]);

  return (
    <div
      ref={elementRef}
      className="group flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/5 p-8 backdrop-blur-md transition-all duration-300 hover:border-indigo-500/30 hover:bg-white/8 hover:shadow-lg hover:shadow-indigo-500/5"
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <Icon className="h-7 w-7" />
      </div>
      <span className="mt-4 font-heading text-4xl font-extrabold text-white sm:text-5xl">
        {count === 0 ? "0" : count.toLocaleString()}
        {suffix}
      </span>
      <span className="mt-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </span>
    </div>
  );
}

interface StatsSectionProps {
  stats?: {
    events?: number | null;
    registrations?: number | null;
    competitors?: number | null;
    submissions?: number | null;
  } | null;
}

export function StatsSection({ stats }: StatsSectionProps) {
  return (
    <section className="relative bg-[#0b0b1a] py-24">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 h-[400px] w-[400px] rounded-full bg-purple-500/5 blur-[120px]" />
      <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-indigo-500/5 blur-[100px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
            By the Numbers
          </h2>
          <p className="mt-2 text-sm text-gray-500">Real-time event statistics</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatItem
            icon={Calendar}
            value={stats?.events ?? 0}
            suffix="+"
            label="Total Events"
            color="#818cf8"
          />
          <StatItem
            icon={Trophy}
            value={stats?.registrations ?? 0}
            suffix="+"
            label="Registrations"
            color="#34d399"
          />
          <StatItem
            icon={Users}
            value={stats?.competitors ?? 0}
            suffix="+"
            label="Total Competitors"
            color="#a78bfa"
          />
          <StatItem
            icon={UploadCloud}
            value={stats?.submissions ?? 0}
            suffix="+"
            label="Project Submissions"
            color="#f59e0b"
          />
        </div>
      </div>
    </section>
  );
}
