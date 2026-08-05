import { useCallback, useEffect, useRef, useState } from "react"
import { getApiTokens } from "./api"
import type { ChatMessage } from "../types"

const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) || "/api/v1"

export interface WsStatusEvent {
  event: "status"
  appointmentId: string
  status: string
  startedAt?: string | null
}

export type WsMessageEvent =
  | {
      event: "message" | "typing" | "welcome" | "error"
      message?: ChatMessage
      senderId?: string
      reason?: string
    }
  | WsStatusEvent

interface UseChatSocketOptions {
  appointmentId: string
  threadId?: string
  enabled?: boolean
  onMessage: (msg: ChatMessage) => void
  onTyping?: (senderId: string) => void
  onStatusChange?: (connected: boolean) => void
  onStatus?: (payload: WsStatusEvent) => void
}

function baseWsUrl(): string {
  const url = new URL(API_BASE, window.location.origin)
  const proto = url.protocol === "https:" ? "wss:" : "ws:"
  return `${proto}//${url.host}`
}

export function useChatSocket({
  appointmentId,
  threadId = "",
  enabled = true,
  onMessage,
  onTyping,
  onStatusChange,
  onStatus,
}: UseChatSocketOptions) {
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<WebSocket | null>(null)
  const retryRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closedByUserRef = useRef(false)

  const handlersRef = useRef({ onMessage, onTyping, onStatusChange, onStatus })
  handlersRef.current = { onMessage, onTyping, onStatusChange, onStatus }

  const sendRaw = useCallback((payload: unknown) => {
    const ws = socketRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return false
    ws.send(JSON.stringify(payload))
    return true
  }, [])

  const sendText = useCallback(
    (text: string) => sendRaw({ action: "send", type: "text", text }),
    [sendRaw],
  )

  const sendVoice = useCallback(
    (data: string, mimeType: string, duration: number) =>
      sendRaw({ action: "send", type: "voice", data, mimeType, duration }),
    [sendRaw],
  )

  const sendTyping = useCallback(
    () => sendRaw({ action: "typing" }),
    [sendRaw],
  )

  const close = useCallback(() => {
    closedByUserRef.current = true
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    socketRef.current?.close(1000)
    socketRef.current = null
  }, [])

  useEffect(() => {
    setConnected(false)
    retryRef.current = 0
    if (!enabled || (!appointmentId && !threadId)) {
      closedByUserRef.current = true
      return
    }
    closedByUserRef.current = false

    let disposed = false

    const connect = () => {
      if (disposed || closedByUserRef.current) return
      const token = getApiTokens()?.access
      const path = threadId
        ? `/ws/support/${threadId}/chat/`
        : `/ws/consult/${appointmentId}/chat/`
      const url = `${baseWsUrl()}${path}?token=${encodeURIComponent(token || "")}`
      let ws: WebSocket
      try {
        ws = new WebSocket(url)
      } catch {
        scheduleRetry()
        return
      }
      socketRef.current = ws

      ws.onopen = () => {
        if (disposed) return
        retryRef.current = 0
        setConnected(true)
        handlersRef.current.onStatusChange?.(true)
      }
      ws.onmessage = (event) => {
        let parsed: WsMessageEvent
        try {
          parsed = JSON.parse(event.data)
        } catch {
          return
        }
        if (parsed.event === "message" && parsed.message) {
          handlersRef.current.onMessage(parsed.message)
        } else if (parsed.event === "typing" && parsed.senderId) {
          handlersRef.current.onTyping?.(parsed.senderId)
        } else if (parsed.event === "status") {
          handlersRef.current.onStatus?.(parsed)
        }
      }
      ws.onerror = () => {
        ws.close()
      }
      ws.onclose = () => {
        socketRef.current = null
        setConnected(false)
        handlersRef.current.onStatusChange?.(false)
        if (!disposed && !closedByUserRef.current) scheduleRetry()
      }
    }

    const scheduleRetry = () => {
      if (disposed || closedByUserRef.current) return
      const delay = Math.min(1000 * Math.pow(2, retryRef.current), 15000)
      retryRef.current += 1
      timerRef.current = setTimeout(connect, delay)
    }

    connect()

    return () => {
      disposed = true
      closedByUserRef.current = true
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
      if (socketRef.current) {
        socketRef.current.onclose = null
        socketRef.current.close(1000)
        socketRef.current = null
      }
      setConnected(false)
      handlersRef.current.onStatusChange?.(false)
    }
  }, [appointmentId, threadId, enabled])

  return { connected, sendText, sendVoice, sendTyping, close }
}