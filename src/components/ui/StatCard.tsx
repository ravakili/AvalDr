import GlassCard from './GlassCard'
import { cn, toFa } from '../../lib/utils'

interface Props {
  title: string
  value: number | string
  delta?: string
  trend?: 'up' | 'down' | 'flat'
  icon: React.ReactNode
  tone?: 'teal' | 'blue' | 'amber' | 'violet' | 'rose'
}

const tones = {
  teal: 'from-primary-400/30 to-primary-600/20 text-primary-700',
  blue: 'from-blue-400/30 to-blue-600/20 text-blue-700',
  amber: 'from-amber-400/30 to-amber-600/20 text-amber-700',
  violet: 'from-violet-400/30 to-violet-600/20 text-violet-700',
  rose: 'from-rose-400/30 to-rose-600/20 text-rose-700',
}

const trendColor = {
  up: 'text-emerald-600',
  down: 'text-red-500',
  flat: 'text-ink-400',
}

export default function StatCard({
  title,
  value,
  delta,
  trend = 'flat',
  icon,
  tone = 'teal',
}: Props) {
  const display = typeof value === 'number' ? toFa(value) : value
  return (
    <GlassCard hover className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-ink-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tabular text-ink-800">{display}</p>
          {delta && (
            <p className={cn('mt-1 text-xs font-medium', trendColor[trend])}>{delta}</p>
          )}
        </div>
        <div
          className={cn(
            'grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br',
            tones[tone],
          )}
        >
          {icon}
        </div>
      </div>
    </GlassCard>
  )
}
