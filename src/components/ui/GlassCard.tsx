import { cn } from '../../lib/utils'

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'soft' | 'dark'
  hover?: boolean
}

const variantClass = {
  default: 'glass',
  soft: 'glass-soft',
  dark: 'glass-dark',
}

/** Frosted-glass surface used for cards, panels and modals. */
export default function GlassCard({
  variant = 'default',
  hover = false,
  className,
  children,
  ...rest
}: Props) {
  return (
    <div
      className={cn(
        variantClass[variant],
        'rounded-2xl',
        hover && 'lift',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
