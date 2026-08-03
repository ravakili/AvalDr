import { useLayoutEffect, useRef, useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import { motion } from "framer-motion"
import { cn } from "../../lib/utils"
import { navFor, type NavItem } from "./nav"
import type { Role } from "../../types"

interface Props {
  role: Role
}

interface Rect {
  left: number
  width: number
}

function isItemActive(item: NavItem, role: Role, pathname: string): boolean {
  const home = `/${role}`
  if (item.to === home) return pathname === home
  if (pathname === home) return false
  return pathname === item.to || pathname.startsWith(`${item.to}/`)
}

export default function MobileBottomNav({ role }: Props) {
  const items = navFor[role].slice(0, 5)
  const location = useLocation()
  const activeIndex = items.findIndex((item) => isItemActive(item, role, location.pathname))
  const activeIdx = activeIndex >= 0 ? activeIndex : 0

  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([])
  const [rect, setRect] = useState<Rect | null>(null)

  useLayoutEffect(() => {
    const el = itemRefs.current[activeIdx]
    const container = containerRef.current
    if (!el || !container) {
      setRect(null)
      return
    }
    const c = container.getBoundingClientRect()
    const e = el.getBoundingClientRect()
    setRect({ left: e.left - c.left, width: e.width })
  }, [activeIdx])

  return (
    <nav
      ref={containerRef}
      className={cn(
        "glass fixed bg-primary-500/20 inset-x-3 bottom-3 z-30 flex items-stretch justify-around",
        "rounded-full p-1.5 shadow-glass-sm lg:hidden",
      )}
    >
      <motion.div
        className="absolute top-1.5 h-[calc(100%-0.8rem)] rounded-full bg-primary-500/90"
        initial={false}
        animate={{
          left: rect ? rect.left : 0,
          width: rect ? rect.width : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 28, mass: 0.4 }}
      />
      {items.map((item, index) => {
        const isActive = activeIdx === index
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === `/${role}`}
            ref={(el) => {
              itemRefs.current[index] = el
            }}
            className={cn(
              "relative flex flex-1 flex-col items-center gap-1 rounded-full py-2",
              "text-[10px] font-medium transition-colors duration-200",
              isActive ? "text-white" : "text-ink-700 dark:text-ink-200",
            )}
          >
            <motion.span
              initial={isActive ? "active" : "inactive"}
              animate={isActive ? "active" : "inactive"}
              variants={{ active: { scale: 1.1 }, inactive: { scale: 1 } }}
              transition={{ type: "spring", stiffness: 420, damping: 24 }}
            >
              <span className="[&>svg]:h-5 [&>svg]:w-5">{item.icon}</span>
            </motion.span>
            <motion.span
              animate={{ opacity: isActive ? 1 : 0.85 }}
              transition={{ duration: 0.18 }}
            >
              {item.label}
            </motion.span>
          </NavLink>
        )
      })}
    </nav>
  )
}
