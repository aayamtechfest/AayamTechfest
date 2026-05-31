"use client";

import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import { Server, Wifi, WifiOff } from "lucide-react";

interface SocketStatusIndicatorProps {
  isAdmin?: boolean;
}

export function SocketStatusIndicator({ isAdmin = false }: SocketStatusIndicatorProps) {
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [serverType, setServerType] = useState<"render" | "local">("render");
  const [socketUrl, setSocketUrl] = useState("");

  useEffect(() => {
    // Resolve URL from window.__SOCKET_URL__ or process.env
    const url = (typeof window !== "undefined" && (window as any).__SOCKET_URL__) 
      || process.env.NEXT_PUBLIC_SOCKET_URL 
      || "http://localhost:3001";
    
    setSocketUrl(url);
    if (url.includes("onrender.com") || url.includes("render")) {
      setServerType("render");
    } else {
      setServerType("local");
    }

    const socket = getSocket();
    
    const onConnect = () => setStatus("connected");
    const onDisconnect = () => setStatus("disconnected");
    const onConnectError = () => setStatus("disconnected");

    // Check current connection state
    if (socket.connected) {
      setStatus("connected");
    } else {
      socket.connect();
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    // Set a timeout to mark as disconnected if it doesn't connect within 5 seconds
    const timeout = setTimeout(() => {
      if (!socket.connected) {
        setStatus("disconnected");
      }
    }, 5000);

    return () => {
      clearTimeout(timeout);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
    };
  }, []);

  const cleanedUrl = socketUrl.replace(/^https?:\/\//, "");

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-black/40 px-3.5 py-1.5 text-xs font-medium text-gray-300 backdrop-blur-md transition-all duration-300">
      <span className="relative flex h-2 w-2">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
          status === "connected" ? "bg-emerald-400" : status === "connecting" ? "bg-amber-400" : "bg-rose-400"
        }`}></span>
        <span className={`relative inline-flex rounded-full h-2 w-2 ${
          status === "connected" ? "bg-emerald-500" : status === "connecting" ? "bg-amber-500" : "bg-rose-500"
        }`}></span>
      </span>
      
      <span className="flex items-center gap-1">
        {status === "connected" ? (
          isAdmin ? (
            serverType === "render" ? (
              <span>Connected via <strong className="text-indigo-300">Render Server</strong></span>
            ) : (
              <span>Connected via <strong className="text-purple-300">Local Event Server</strong></span>
            )
          ) : (
            <span>Arena Server: <strong className="text-emerald-400">Online</strong></span>
          )
        ) : status === "connecting" ? (
          <span className="text-gray-400">Connecting to server...</span>
        ) : (
          <span className="text-rose-400 font-semibold flex items-center gap-1">
            <WifiOff className="h-3.5 w-3.5" /> Server Unreachable
          </span>
        )}
      </span>

      {isAdmin && cleanedUrl && (
        <span className="text-gray-500 text-[10px] border-l border-white/10 pl-2 font-mono hidden sm:inline" title={socketUrl}>
          {cleanedUrl}
        </span>
      )}
    </div>
  );
}
