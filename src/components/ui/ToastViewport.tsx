import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useToastStore, type ToastTone } from '../../store/toastStore'

const toneStyles: Record<ToastTone, { panel: string; icon: string; glyph: typeof Info }> = {
  success: { panel: 'border-emerald-200/80 bg-emerald-50/95', icon: 'text-emerald-600', glyph: CheckCircle2 },
  error: { panel: 'border-red-200/80 bg-red-50/95', icon: 'text-red-600', glyph: AlertCircle },
  warning: { panel: 'border-amber-200/80 bg-amber-50/95', icon: 'text-amber-600', glyph: TriangleAlert },
  info: { panel: 'border-sky-200/80 bg-sky-50/95', icon: 'text-sky-600', glyph: Info },
}

export default function ToastViewport() {
  const items = useToastStore((state) => state.items)
  const dismiss = useToastStore((state) => state.dismiss)

  return (
    <div className="pointer-events-none fixed left-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2" role="region" aria-label="پیام‌ها">
      {items.map((item) => {
        const meta = toneStyles[item.tone]
        const Glyph = meta.glyph
        return (
          <div key={item.id} className={cn('pointer-events-auto flex items-start gap-3 rounded-lg border p-3 shadow-xl backdrop-blur-xl animate-pop-in', meta.panel)} role={item.tone === 'error' ? 'alert' : 'status'}>
            <Glyph className={cn('mt-0.5 h-5 w-5 shrink-0', meta.icon)} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink-800">{item.title}</p>
              {item.message && <p className="mt-0.5 text-xs leading-5 text-ink-600">{item.message}</p>}
            </div>
            <button type="button" onClick={() => dismiss(item.id)} className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-ink-400 transition hover:bg-black/5 hover:text-ink-700" aria-label="بستن پیام">
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
