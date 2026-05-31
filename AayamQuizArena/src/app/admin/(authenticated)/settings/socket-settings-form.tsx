"use client";

import { useState } from "react";
import { toast } from "sonner";
import { saveSocketUrlAction } from "@/actions/settings.actions";
import { io } from "socket.io-client";
import { 
  Wifi, 
  WifiOff, 
  Settings, 
  Save, 
  RefreshCw,
  CheckCircle,
  XCircle,
  HelpCircle
} from "lucide-react";

interface SocketSettingsFormProps {
  initialSocketUrl: string;
}

export default function SocketSettingsForm({ initialSocketUrl }: SocketSettingsFormProps) {
  const [socketUrl, setSocketUrl] = useState(initialSocketUrl);
  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "connected" | "unreachable">("idle");
  const [isSaving, setIsSaving] = useState(false);

  const handleTestConnection = () => {
    if (!socketUrl) {
      toast.error("Please enter a Socket.IO URL to test.");
      return;
    }

    setTestStatus("testing");
    toast.info("Initiating connection test...");

    // Connect to the custom URL with a 5-second timeout
    const tempSocket = io(socketUrl, {
      transports: ["websocket", "polling"],
      timeout: 5000,
      reconnection: false,
    });

    tempSocket.on("connect", () => {
      setTestStatus("connected");
      toast.success("🟢 Connection validation successful!");
      tempSocket.disconnect();
    });

    tempSocket.on("connect_error", (err) => {
      console.error("Test socket connection error:", err);
      setTestStatus("unreachable");
      toast.error("🔴 Socket server is unreachable.");
      tempSocket.disconnect();
    });

    // Backup connection timeout fallback
    setTimeout(() => {
      if (tempSocket.connected) return;
      setTestStatus("unreachable");
      tempSocket.disconnect();
    }, 5500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const res = await saveSocketUrlAction(socketUrl.trim() || null);
    setIsSaving(false);

    if (res.success) {
      toast.success("Socket.IO configuration saved successfully.");
      window.location.reload();
    } else {
      toast.error(res.error || "Failed to save configuration.");
    }
  };

  const handleClear = async () => {
    if (!confirm("Are you sure you want to revert to default Render socket server?")) return;
    
    setIsSaving(true);
    const res = await saveSocketUrlAction(null);
    setIsSaving(false);

    if (res.success) {
      setSocketUrl("");
      setTestStatus("idle");
      toast.success("Reverted to default Render socket server.");
      window.location.reload();
    } else {
      toast.error("Failed to reset settings.");
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl space-y-4">
      <h3 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
        <Settings className="h-5 w-5 text-indigo-400" />
        Socket.IO Server Configuration
      </h3>
      <p className="text-xs text-gray-400 leading-relaxed">
        Configure a custom/local Socket.IO server URL (e.g. during offline event WiFi failures). If empty, the system falls back to the default Render environment URL.
      </p>

      <form onSubmit={handleSave} className="space-y-4 pt-2">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
            Socket Server URL
          </label>
          <input
            type="url"
            value={socketUrl}
            onChange={(e) => {
              setSocketUrl(e.target.value);
              setTestStatus("idle"); // Reset status on change
            }}
            placeholder="https://arena-socket.onrender.com or http://192.168.1.50:5001"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        {/* Connection testing section */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-xl bg-black/25 border border-white/5">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-400">Connection Status:</span>
            {testStatus === "idle" && (
              <span className="text-gray-500 font-medium flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4" /> Untested
              </span>
            )}
            {testStatus === "testing" && (
              <span className="text-amber-400 font-medium flex items-center gap-1.5">
                <RefreshCw className="h-4 w-4 animate-spin" /> Testing...
              </span>
            )}
            {testStatus === "connected" && (
              <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                <CheckCircle className="h-4 w-4 shrink-0" /> 🟢 Connected
              </span>
            )}
            {testStatus === "unreachable" && (
              <span className="text-rose-400 font-medium flex items-center gap-1.5">
                <XCircle className="h-4 w-4 shrink-0" /> 🔴 Unreachable
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testStatus === "testing" || !socketUrl}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-white/10 disabled:opacity-50"
          >
            {testStatus === "testing" ? "Testing..." : "Test Connection"}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSaving || testStatus === "testing"}
            className="flex-grow flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Config"}
          </button>
          
          {initialSocketUrl && (
            <button
              type="button"
              onClick={handleClear}
              disabled={isSaving}
              className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/15 hover:text-red-300 transition-all disabled:opacity-50"
            >
              Reset to Default
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
