"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

interface ReleaseCountdownProps {
  releaseTime: string;
}

export function ReleaseCountdown({ releaseTime }: ReleaseCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isReleased: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isReleased: false,
  });

  useEffect(() => {
    const targetDate = new Date(releaseTime).getTime();

    function calculateTime() {
      const difference = targetDate - Date.now();

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isReleased: true });
        return true;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeLeft({ days, hours, minutes, seconds, isReleased: false });
      return false;
    }

    // Run once initially
    const isDone = calculateTime();
    if (isDone) return;

    const timer = setInterval(() => {
      const isDone = calculateTime();
      if (isDone) {
        clearInterval(timer);
        // Refresh page to load unlocked content
        window.location.reload();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [releaseTime]);

  if (timeLeft.isReleased) {
    return (
      <div className="mt-4 rounded-xl bg-emerald-500/10 p-4 border border-emerald-500/20 text-emerald-400 text-sm font-semibold flex items-center gap-2 justify-center">
        <Clock className="h-4 w-4 animate-bounce" />
        <span>Challenge is now unlocked! Please refresh the page to view it.</span>
      </div>
    );
  }

  return (
    <div className="mt-2 animate-fade-in">
      <div className="grid grid-cols-4 gap-1.5 min-[375px]:gap-2 sm:gap-3 max-w-[260px] min-[375px]:max-w-[300px] sm:max-w-sm mx-auto">
        {[
          { label: "Days", value: timeLeft.days },
          { label: "Hours", value: timeLeft.hours },
          { label: "Mins", value: timeLeft.minutes },
          { label: "Secs", value: timeLeft.seconds },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-lg sm:rounded-xl border border-white/10 bg-black/30 py-2 px-1.5 min-[375px]:py-2.5 min-[375px]:px-2 sm:p-3 text-center transition-all duration-300 hover:scale-105 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5"
          >
            <span className="block font-heading text-lg min-[375px]:text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-200 via-indigo-400 to-purple-400 bg-clip-text text-transparent drop-shadow-md">
              {String(item.value).padStart(2, "0")}
            </span>
            <span className="block text-[8px] min-[375px]:text-[9px] sm:text-[10px] uppercase tracking-normal min-[375px]:tracking-wider font-semibold text-gray-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
