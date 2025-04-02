"use client";

import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { toast } from "sonner";

let socket: Socket | null = null;

export function useSocket(userId: string | undefined) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastPong, setLastPong] = useState<string | null>(null);

  useEffect(() => {
    // Only initialize socket if we have a userId
    if (!userId) return;

    // Create socket instance if it doesn't exist
    if (!socket) {
      socket = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || window.location.origin, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: true,
      });
    }

    // Set up event listeners
    function onConnect() {
      setIsConnected(true);
      // Authenticate with the server
      socket?.emit("authenticate", userId);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    function onConnectError() {
      // Fall back to polling if WebSocket connection fails
      toast.error("WebSocket connection failed, falling back to polling");
    }

    function onPong(time: string) {
      setLastPong(time);
    }

    // Register event handlers
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("pong", onPong);

    // Connect if not already connected
    if (!socket.connected) {
      socket.connect();
    } else {
      // If already connected, authenticate
      socket.emit("authenticate", userId);
      setIsConnected(true);
    }

    // Cleanup function
    return () => {
      socket?.off("connect", onConnect);
      socket?.off("disconnect", onDisconnect);
      socket?.off("connect_error", onConnectError);
      socket?.off("pong", onPong);
    };
  }, [userId]);

  // Function to manually send a ping
  const sendPing = () => {
    socket?.emit("ping");
  };

  return { socket, isConnected, lastPong, sendPing };
}
