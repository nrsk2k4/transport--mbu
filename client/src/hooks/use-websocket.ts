import { useEffect, useRef, useState } from "react";
import { WebSocketClient } from "@/lib/websocket";
import { type WebSocketMessage } from "@shared/schema";

export function useWebSocket() {
  const wsRef = useRef<WebSocketClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    wsRef.current = new WebSocketClient();
    
    // Monitor connection status
    const checkConnection = setInterval(() => {
      setIsConnected(wsRef.current?.isConnected || false);
    }, 1000);

    wsRef.current.connect();

    return () => {
      clearInterval(checkConnection);
      wsRef.current?.disconnect();
    };
  }, []);

  const sendMessage = (message: WebSocketMessage & { userId?: string }) => {
    wsRef.current?.send(message);
  };

  const subscribe = (type: string, handler: (data: any) => void) => {
    wsRef.current?.on(type, handler);
  };

  const unsubscribe = (type: string) => {
    wsRef.current?.off(type);
  };

  return {
    isConnected,
    sendMessage,
    subscribe,
    unsubscribe,
  };
}
