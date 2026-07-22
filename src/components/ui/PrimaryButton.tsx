import { cn } from '../../lib/utils'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'subtle'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
}

const variants = {
  primary:
    'bg-primary-500 text-white shadow-glass-sm hover:bg-primary-600 active:scale-[.98]',
  ghost:
    'bg-white/40 text-primary-700 border border-white/60 hover:bg-white/60 backdrop-blur-md',
  subtle: 'bg-primary-50 text-primary-700 hover:bg-primary-100',
  danger: 'bg-red-500/90 text-white hover:bg-red-500 shadow-glass-sm',
}

export default function PrimaryButton({
  variant = 'primary',
  size = 'md',
  icon,
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:opacity-50 disabled:pointer-events-none',
        sizes[size],
        variants[variant],
        className,
      )}
      {...rest}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  )
}
