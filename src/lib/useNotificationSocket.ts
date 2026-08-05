import { useEffect, useRef } from "react";
import { getApiTokens } from "./api";
import type { UserNotification } from "../types";

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) || "/api/v1";

function notificationWsUrl(userId: string) {
  const url = new URL(API_BASE, window.location.origin);
  const protocol = url.protocol === "https:" ? "wss:" : "ws:";
  const token = getApiTokens()?.access || "";
  return `${protocol}//${url.host}/ws/notifications/${encodeURIComponent(userId)}/?token=${encodeURIComponent(token)}`;
}

interface Options {
  userId?: string;
  onNotification: (notification: UserNotification) => void;
  onStatusChange?: (connected: boolean) => void;
}

export function useNotificationSocket({
  userId,
  onNotification,
  onStatusChange,
}: Options) {
  const handlerRef = useRef({ onNotification, onStatusChange });
  handlerRef.current = { onNotification, onStatusChange };

  useEffect(() => {
    if (!userId) {
      handlerRef.current.onStatusChange?.(false);
      return;
    }

    let disposed = false;
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let retryCount = 0;

    const connect = () => {
      if (disposed) return;
      try {
        socket = new WebSocket(notificationWsUrl(userId));
      } catch {
        scheduleRetry();
        return;
      }

      socket.onopen = () => {
        retryCount = 0;
        handlerRef.current.onStatusChange?.(true);
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as {
            event?: string;
            notification?: UserNotification;
          };
          if (payload.event === "new_notification" && payload.notification) {
            handlerRef.current.onNotification(payload.notification);
          }
        } catch {
          // Ignore malformed frames and keep the connection alive.
        }
      };

      socket.onerror = () => socket?.close();
      socket.onclose = () => {
        socket = null;
        handlerRef.current.onStatusChange?.(false);
        scheduleRetry();
      };
    };

    const scheduleRetry = () => {
      if (disposed || retryTimer) return;
      const delay = Math.min(1000 * 2 ** retryCount, 15000);
      retryCount += 1;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        connect();
      }, delay);
    };

    connect();

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      socket?.close(1000);
      socket = null;
      handlerRef.current.onStatusChange?.(false);
    };
  }, [userId]);
}
