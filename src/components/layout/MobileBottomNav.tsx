import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { navFor } from './nav'
import type { Role } from '../../types'

interface Props {
  role: Role
}

/**
 * Fixed bottom navigation bar shown on mobile (lg:hidden).
 * Renders the role's primary nav items as tappable icon tabs.
 */
export default function MobileBottomNav({ role }: Props) {
  // Limit to first 5 items so the bar never overflows on small screens.
  const items = navFor[role].slice(0, 5)

  return (
    <nav className="glass fixed inset-x-3 bottom-3 z-30 flex items-stretch justify-around rounded-full p-1.5 lg:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === `/${role}`}
          className={({ isActive }) =>
            cn(
              'flex flex-1 flex-col items-center gap-1 rounded-full py-2 text-[10px] font-medium transition-all',
              isActive
                ? 'bg-primary-500 text-white shadow-glass-sm'
                : 'text-ink-900  dark:text-ink-200',
            )
          }
        >
          <span className="[&>svg]:h-5 [&>svg]:w-5">{item.icon}</span>
          <span className="truncate">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
