import { cn } from '../../lib/utils'
import type { AppointmentStatus } from '../../types'
import {
  Clock,
  ShieldCheck,
  CreditCard,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../../components/ui/tooltip'

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
  children?: React.ReactNode
  className?: string
  dot?: boolean
  icon?: React.ReactNode
}

export default function Badge({ 
  tone = 'gray', 
  children, 
  className, 
  dot, 
  icon 
}: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium backdrop-blur-md',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {icon && <span className="h-3.5 w-3.5">{icon}</span>}
      {children}
    </span>
  )
}

const statusMap: Record<AppointmentStatus, { 
  tone: Tone; 
  icon: React.ReactNode;
  label: string;
}> = {
  waiting: { 
    tone: 'amber', 
    icon: <Clock className="h-3.5 w-3.5" />,
    label: 'در انتظار'
  },
  'pending-approval': { 
    tone: 'blue', 
    icon: <ShieldCheck className="h-3.5 w-3.5" />,
    label: 'منتظر تأیید'
  },
  'pending-payment': { 
    tone: 'blue', 
    icon: <CreditCard className="h-3.5 w-3.5" />,
    label: 'در انتظار پرداخت'
  },
  'in-progress': { 
    tone: 'teal', 
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    label: 'در حال انجام'
  },
  completed: { 
    tone: 'green', 
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: 'تکمیل شده'
  },
  cancelled: { 
    tone: 'red', 
    icon: <XCircle className="h-3.5 w-3.5" />,
    label: 'لغو شده'
  },
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const { tone, icon, label } = statusMap[status]
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Badge tone={tone} icon={icon} />
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}