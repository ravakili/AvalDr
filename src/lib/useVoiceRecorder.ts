import { useCallback, useEffect, useRef, useState } from "react"

export interface VoiceRecording {
  blob: Blob
  mimeType: string
  duration: number
  objectUrl: string
}

function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return ""
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ]
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return "audio/webm"
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string | null
      if (!result) return reject(new Error("خواندن فایل ناموفق بود"))
      const base64 = result.split(",")[1]
      resolve(base64 || "")
    }
    reader.onerror = () => reject(new Error("خواندن فایل ناموفق بود"))
    reader.readAsDataURL(blob)
  })
}

export function useVoiceRecorder() {
  const [isSupported, setIsSupported] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [recording, setRecording] = useState<VoiceRecording | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const startTimeRef = useRef(0)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  useEffect(() => {
    const supported =
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices?.getUserMedia &&
      typeof MediaRecorder !== "undefined"
    setIsSupported(supported)
    return () => {
      if (tickRef.current) clearInterval(tickRef.current)
      streamRef.current?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const start = useCallback(async () => {
    if (recorderRef.current || isRecording) return
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setIsSupported(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      streamRef.current = stream
      const mimeType = pickMime()
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      recorderRef.current = recorder
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" })
        const duration = Math.max(0.6, (Date.now() - startTimeRef.current) / 1000)
        setRecording({
          blob,
          mimeType: mimeType || "audio/webm",
          duration,
          objectUrl: URL.createObjectURL(blob),
        })
      }
      startTimeRef.current = Date.now()
      recorder.start()
      setRecording(null)
      setRecordingTime(0)
      setIsRecording(true)
      tickRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000)
    } catch {
      setIsSupported(false)
      cleanupStream()
    }
  }, [isRecording, cleanupStream])

  const clearPreview = useCallback(() => {
    setRecording((rec) => {
      if (rec) URL.revokeObjectURL(rec.objectUrl)
      return null
    })
  }, [])

  const stop = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
    const recorder = recorderRef.current
    recorderRef.current = null
    cleanupStream()
    setIsRecording(false)
    if (!recorder) return
    try {
      recorder.stop()
    } catch {
      /* already stopped */
    }
  }, [cleanupStream])

  const cancel = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current)
      tickRef.current = null
    }
    const recorder = recorderRef.current
    recorderRef.current = null
    cleanupStream()
    setIsRecording(false)
    setRecording(null)
    if (recorder && recorder.state !== "inactive") {
      try {
        recorder.onstop = null
        recorder.stop()
      } catch {
        /* ignore */
      }
    }
  }, [cleanupStream])

  return {
    isSupported,
    isRecording,
    recordingTime,
    recording,
    start,
    stop,
    cancel,
    clearPreview,
  }
}