import GlassCard from './GlassCard'
import { cn } from '../../lib/utils'

export interface TabItem {
  key: string
  label: string
  count?: number
}

interface Props {
  tabs: TabItem[]
  active: string
  onChange: (key: string) => void
  className?: string
}

export default function Tabs({ tabs, active, onChange, className }: Props) {
  return (
    <GlassCard className={cn('flex flex-nowrap items-center gap-1 overflow-x-auto p-1 scrollbar-none', className)}>
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition',
            active === t.key
              ? 'bg-primary-500 text-white shadow-glass-sm'
              : 'text-ink-500 hover:bg-white/60',
          )}
        >
          {t.label}
          {typeof t.count === 'number' && (
            <span
              className={cn(
                'rounded-full px-1.5 text-[10px] font-bold',
                active === t.key ? 'bg-white/25' : 'bg-ink-100 text-ink-500',
              )}
            >
              {t.count}
            </span>
          )}
        </button>
      ))}
    </GlassCard>
  )
}
