import GlassCard from './GlassCard'
import { cn } from '../../lib/utils'

interface Props {
  title: string
  subtitle?: string
  children: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export default function ChartCard({ title, subtitle, children, action, className }: Props) {
  return (
    <GlassCard className={cn('p-6', className)}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-ink-800">{title}</h3>
          {subtitle && <p className="text-xs text-ink-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </GlassCard>
  )
}
