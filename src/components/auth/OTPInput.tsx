import { useRef, useCallback, ClipboardEvent, KeyboardEvent, useEffect } from 'react'
import { cn } from '../../lib/utils'
import { toFa } from '../../lib/utils'

interface Props {
  length?: number
  value: string
  onChange: (val: string) => void
  error?: string
  disabled?: boolean
}

export default function OTPInput({ length = 6, value, onChange, error, disabled }: Props) {
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  const focus = useCallback((i: number) => {
    const el = inputs.current[i]
    if (el) setTimeout(() => el.focus(), 10)
  }, [])

  const handleChange = (i: number, char: string) => {
    const digits = char.replace(/\D/g, '')
    if (!digits) return
    const next = value.slice(0, i) + digits.slice(-1) + value.slice(i + 1)
    onChange(next.slice(0, length))
    if (i < length - 1 && next[i]) focus(i + 1)
  }

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      onChange(value.slice(0, i - 1) + value.slice(i))
      focus(i - 1)
    }
    if (e.key === 'ArrowLeft') focus(Math.max(0, i - 1))
    if (e.key === 'ArrowRight') focus(Math.min(length - 1, i + 1))
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (text) onChange(text)
    focus(Math.min(text.length, length - 1))
  }

  useEffect(() => { focus(0) }, [focus])

  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-2 rtl:flex-row" dir="ltr">
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            ref={(el) => { inputs.current[i] = el }}
            id={`otp-${i}`}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={value[i] || ''}
            disabled={disabled}
            aria-label={`رقم ${i + 1} کد تایید`}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className={cn(
              'h-12 w-11 rounded-xl border-2 text-center text-xl font-bold tabular outline-none transition-all duration-150',
              'border-white/60 bg-white/50 backdrop-blur-md',
              'focus:border-primary-400 focus:ring-2 focus:ring-primary-200',
              error && 'border-red-400 focus:border-red-400 focus:ring-red-200',
              value[i] ? 'border-primary-400 bg-primary-50/60' : '',
              disabled && 'opacity-50',
            )}
            style={{ fontFeatureSettings: "'ss01'" }}
          />
        ))}
      </div>
      {error && <p className="mt-2 text-center text-xs text-red-500">{error}</p>}
      {value.length === length && (
        <p className="mt-1 text-center text-xs text-primary-600">{toFa(value)}</p>
      )}
    </div>
  )
}
