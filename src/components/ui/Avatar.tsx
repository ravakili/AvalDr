import { cn } from '../../lib/utils'

interface Props {
  src: string
  alt?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  ring?: boolean
  online?: boolean
  className?: string
}

const sizes = {
  xs: 'h-7 w-7 text-xs',
  sm: 'h-9 w-9 text-sm',
  md: 'h-12 w-12 text-base',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-24 w-24 text-2xl',
}

export default function Avatar({
  src,
  alt = '',
  size = 'md',
  ring = false,
  online = false,
  className,
}: Props) {
  return (
    <div className={cn('relative inline-flex shrink-0', className)}>
      <img
        src={src}
        alt={alt}
        className={cn(
          'rounded-full bg-white/60 object-cover shadow-sm',
          sizes[size],
          ring && 'ring-2 ring-white/80',
        )}
      />
      {online && (
        <span className="absolute bottom-0 left-0 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
      )}
    </div>
  )
}
