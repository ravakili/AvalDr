import { cn } from '../../lib/utils'

interface Props {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
  description?: string
  disabled?: boolean
}

export default function Toggle({ checked, onChange, label, description, disabled }: Props) {
  return (
    <label className={cn('flex cursor-pointer items-center justify-between gap-4', disabled && 'opacity-50')}>
      {(label || description) && (
        <div>
          {label && <p className="text-sm font-medium text-ink-700">{label}</p>}
          {description && <p className="text-xs text-ink-400">{description}</p>}
        </div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
          checked ? 'bg-primary-500' : 'bg-ink-200',
        )}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
            checked ? '-translate-x-6' : '-translate-x-1',
          )}
        />
      </button>
    </label>
  )
}
