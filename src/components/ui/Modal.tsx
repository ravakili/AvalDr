import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import GlassCard from './GlassCard'
import { cn } from '../../lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  footer?: React.ReactNode
}

const sizes = {
  sm: 'max-w-md',
  md: 'max-w-xl',
  lg: 'max-w-3xl',
}

export default function Modal({ open, onClose, title, children, size = 'md', footer }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-ink-900/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <GlassCard
        variant="default"
        className={cn(
          'relative z-10 w-full animate-pop-in p-6',
          sizes[size],
        )}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-ink-800">{title}</h3>
            <button
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full text-ink-400 transition hover:bg-white/50 hover:text-ink-700"
              aria-label="بستن"
            >
              ✕
            </button>
          </div>
        )}
        <div>{children}</div>
        {footer && <div className="mt-6 flex justify-start gap-3">{footer}</div>}
      </GlassCard>
    </div>,
    document.body,
  )
}
