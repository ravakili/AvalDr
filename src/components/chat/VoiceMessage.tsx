import { useEffect, useRef, useState } from "react"
import { BiPlay, BiPause } from "react-icons/bi"
import { cn, toFa } from "../../lib/utils"

interface VoiceMessageProps {
  src: string
  duration?: number
  mine?: boolean
  className?: string
}

function formatTime(seconds: number): string {
  const totalSeconds = Math.max(0, seconds)
  const m = Math.floor(totalSeconds / 60)
  const s = Math.floor(totalSeconds % 60)
  const ms = Math.floor((totalSeconds % 1) * 10)
  
  if (ms > 0) {
    return `${toFa(m)}:${toFa(String(s).padStart(2, "0"))}.${toFa(ms)}`
  }
  return `${toFa(m)}:${toFa(String(s).padStart(2, "0"))}`
}

export default function VoiceMessage({
  src,
  duration,
  mine,
  className,
}: VoiceMessageProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [loadedDuration, setLoadedDuration] = useState<number | null>(null)

  // Use the prop duration if available, otherwise use loaded duration
  const total = duration ?? loadedDuration ?? 0
  const progress = total > 0 ? Math.min(1, current / total) : 0

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    
    const onTime = () => setCurrent(audio.currentTime)
    const onMeta = () => {
      // Only use audio.duration if duration prop is not provided
      if (!duration && audio.duration) {
        setLoadedDuration(audio.duration)
      }
    }
    const onEnded = () => {
      setPlaying(false)
      setCurrent(0)
    }
    
    audio.addEventListener("timeupdate", onTime)
    audio.addEventListener("loadedmetadata", onMeta)
    audio.addEventListener("ended", onEnded)
    
    return () => {
      audio.removeEventListener("timeupdate", onTime)
      audio.removeEventListener("loadedmetadata", onMeta)
      audio.removeEventListener("ended", onEnded)
    }
  }, [duration]) // Re-run if duration changes

  // Reset when src changes
  useEffect(() => {
    setCurrent(0)
    setPlaying(false)
    setLoadedDuration(null)
  }, [src])

  useEffect(() => {
    return () => {
      audioRef.current?.pause()
    }
  }, [src])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    
    if (playing) {
      audio.pause()
      setPlaying(false)
    } else {
      // If we have a duration prop, we can seek if needed
      audio.play()
      setPlaying(true)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <audio 
        ref={audioRef} 
        src={src} 
        preload="metadata"
        // If duration is provided, we can set it as a data attribute for debugging
        data-duration={duration}
      />
      <button
        onClick={toggle}
        aria-label={playing ? "توقف" : "پخش"}
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-full transition active:scale-95",
          mine
            ? "bg-white text-primary-600 hover:bg-white/90"
            : "bg-primary-500 text-white hover:bg-primary-600",
        )}
      >
        {playing ? <BiPause size={18} /> : <BiPlay size={18} />}
      </button>

      <div className={cn("flex flex-col gap-1", className)}>
        <div className="h-1.5 w-36 overflow-hidden rounded-full bg-black/10">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-150",
              mine ? "bg-white/80" : "bg-primary-500",
            )}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <span
          className={cn(
            "text-[10px] tabular-nums",
            mine ? "text-white/80" : "text-ink-400",
          )}
        >
          {formatTime(playing ? current : total)}
        </span>
      </div>
    </div>
  )
}