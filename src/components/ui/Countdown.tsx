import { useEffect, useState } from 'react'
import { cn, toFa } from '../../lib/utils'

interface Props {
  target: string // ISO datetime
  className?: string
  compact?: boolean
}

function diff(target: string) {
  const ms = new Date(target).getTime() - Date.now()
  if (ms <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true }
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms / 3600000) % 24),
    minutes: Math.floor((ms / 60000) % 60),
    seconds: Math.floor((ms / 1000) % 60),
    done: false,
  }
}

/** Live countdown to a target datetime, showing days/hours/minutes/seconds in Persian. */
export default function Countdown({ target, className, compact }: Props) {
  const [t, setT] = useState(() => diff(target))

  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000)
    return () => clearInterval(id)
  }, [target])

  if (t.done) {
    return <span className={cn('text-xs font-medium text-emerald-600', className)}>اکنون</span>
  }

  const units = [
    { v: t.days, l: 'روز' },
    { v: t.hours, l: 'ساعت' },
    { v: t.minutes, l: 'دقیقه' },
    { v: t.seconds, l: 'ثانیه' },
  ]

  if (compact) {
    return (
      <span className={cn('tabular text-xs font-semibold text-primary-700', className)}>
        {t.days > 0 && `${toFa(t.days)} روز و `}
        {toFa(String(t.hours).padStart(2, '0'))}:{toFa(String(t.minutes).padStart(2, '0'))}:
        {toFa(String(t.seconds).padStart(2, '0'))}
      </span>
    )
  }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {units.map((u, i) => (
        <div key={u.l} className="flex items-center gap-1.5">
          <div className="flex min-w-[2.4rem] flex-col items-center rounded-lg bg-white/70 px-2 py-1">
            <span className="text-sm font-bold tabular text-ink-800">
              {toFa(String(u.v).padStart(2, '0'))}
            </span>
            <span className="text-[9px] text-ink-400">{u.l}</span>
          </div>
          {i < units.length - 1 && <span className="text-ink-300">:</span>}
        </div>
      ))}
    </div>
  )
}
