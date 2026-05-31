import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (typeof window === "undefined") {
    throw new Error("Socket.IO client can only be initialized on the client side.");
  }

  if (!socket) {
    const socketUrl = (typeof window !== "undefined" && (window as any).__SOCKET_URL__)
      || process.env.NEXT_PUBLIC_SOCKET_URL
      || "http://localhost:3001";
    socket = io(socketUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
      timeout: 20000,
      transports: ["websocket", "polling"],
    });
  }

  return socket;
};
