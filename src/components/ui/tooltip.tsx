import * as React from 'react'
import { cn } from '../../lib/utils'

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  return <div className="group relative inline-block">{children}</div>
}

export function TooltipTrigger({ 
  children, 
  asChild 
}: { 
  children: React.ReactNode
  asChild?: boolean 
}) {
  return <>{children}</>
}

export function TooltipContent({ 
  children, 
  className 
}: { 
  children: React.ReactNode
  className?: string 
}) {
  return (
    <div
      className={cn(
        'absolute bottom-full left-1/2 -translate-x-1/2 mb-2',
        'px-2 py-1 rounded-md bg-primary-600 text-white text-xs whitespace-nowrap',
        'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
        'transition-all duration-200',
        className
      )}
    >
      {children}
      {/* <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
        <div className="border-4 border-transparent border-t-white" />
      </div> */}
    </div>
  )
}
