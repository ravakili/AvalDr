import { cn } from '../../lib/utils'
import type { AppointmentStatus } from '../../types'

type Tone = 'gray' | 'green' | 'amber' | 'red' | 'blue' | 'teal'

const tones: Record<Tone, string> = {
  gray: 'bg-ink-100/80 text-ink-600 border-ink-200',
  green: 'bg-emerald-100/80 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-100/80 text-amber-700 border-amber-200',
  red: 'bg-red-100/80 text-red-600 border-red-200',
  blue: 'bg-blue-100/80 text-blue-700 border-blue-200',
  teal: 'bg-primary-100/80 text-primary-700 border-primary-200',
}

interface Props {
  tone?: Tone
  children: React.ReactNode
  className?: string
  dot?: boolean
}

export default function Badge({ tone = 'gray', children, className, dot }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium backdrop-blur-md',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  )
}

const statusMap: Record<AppointmentStatus, { tone: Tone; label: string }> = {
  waiting: { tone: 'amber', label: 'در انتظار' },
  'pending-approval': { tone: 'blue', label: 'منتظر تأیید' },
  'in-progress': { tone: 'teal', label: 'در حال انجام' },
  completed: { tone: 'green', label: 'تکمیل شده' },
  cancelled: { tone: 'red', label: 'لغو شده' },
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { tone, label } = statusMap[status]
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  )
}
