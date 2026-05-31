"use client";

import { useEffect } from "react";

export function ServerWakeup() {
  useEffect(() => {
    const socketUrl = (typeof window !== "undefined" && (window as any).__SOCKET_URL__)
      || process.env.NEXT_PUBLIC_SOCKET_URL
      || "http://localhost:3001";

    // Silent background ping to warm up or trigger health endpoint of the socket server
    fetch(`${socketUrl}/health`, { mode: "cors" })
      .then((res) => {
        if (res.ok) {
          console.log("⚡ [Socket Health] Connection established successfully.");
        }
      })
      .catch((err) => {
        console.warn("⚠️ [Socket Health] Server ping failed or server is offline:", err.message);
      });
  }, []);

  return null;
}
