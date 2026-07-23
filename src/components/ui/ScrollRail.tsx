import { Children } from 'react'
import { cn } from '../../lib/utils'

interface Props {
  /** Tailwind classes that define the desktop (md+) layout, e.g. "md:grid md:grid-cols-2 xl:grid-cols-3" or "md:flex md:flex-col md:gap-3". */
  desktopClassName?: string
  /** Width/spacing classes applied to each child wrapper on mobile. Defaults to a peek-style card width. */
  itemClassName?: string
  /** Gap between items on mobile. */
  gapClassName?: string
  className?: string
  children: React.ReactNode
}

/**
 * Horizontal swipe rail for cards on mobile (overflow-x-auto + snap),
 * that restores a normal grid/stack layout at the `md` breakpoint.
 *
 * RTL aware: since the app body is `direction: rtl`, cards flow
 * right-to-left automatically — no `dir` override needed.
 */
export default function ScrollRail({
  desktopClassName,
  itemClassName = 'w-[82%] max-w-[340px]',
  gapClassName = 'gap-4',
  className,
  children,
}: Props) {
  return (
    <div
      className={cn(
        // Mobile: horizontal swipe rail
        'flex overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-1 px-1 pb-1',
        gapClassName,
        // Desktop: hand layout back to the caller (grid or vertical stack)
        'md:overflow-visible md:snap-none md:-mx-0 md:px-0 md:pb-0',
        desktopClassName,
        className,
      )}
    >
      {Children.map(children, (child) => (
        <div
          className={cn(
            'snap-start shrink-0',
            itemClassName,
            // On desktop let the grid/flex-col own the sizing
            'md:w-auto md:max-w-none md:shrink',
          )}
        >
          {child}
        </div>
      ))}
    </div>
  )
}
