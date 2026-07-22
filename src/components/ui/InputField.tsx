import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  icon?: React.ReactNode
  error?: string
}

const InputField = forwardRef<HTMLInputElement, Props>(function InputField(
  { label, hint, icon, error, className, id, ...rest },
  ref,
) {
  const inputId = id || rest.name
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-sm font-medium text-ink-700"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-ink-400">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'glass-input w-full rounded-xl py-2.5 text-ink-800 shadow-sm outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-200',
            icon ? 'pr-10 pl-4' : 'px-4',
            error && 'border-red-300 focus:border-red-300 focus:ring-red-200',
            className,
          )}
          {...rest}
        />
      </div>
      {(hint || error) && (
        <p className={cn('mt-1 text-xs', error ? 'text-red-500' : 'text-ink-400')}>
          {error || hint}
        </p>
      )}
    </div>
  )
})

export default InputField

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
}

export const SelectField = forwardRef<HTMLSelectElement, SelectProps>(
  function SelectField({ label, hint, className, id, children, ...rest }, ref) {
    const selectId = id || rest.name
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium text-ink-700"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={cn(
            'glass-input w-full rounded-xl px-4 py-2.5 text-ink-800 shadow-sm outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-200',
            className,
          )}
          {...rest}
        >
          {children}
        </select>
        {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
      </div>
    )
  },
)

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function TextArea({ label, className, id, ...rest }, ref) {
    const tId = id || rest.name
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={tId}
            className="mb-1.5 block text-sm font-medium text-ink-700"
          >
            {label}
          </label>
        )}
        <textarea
          id={tId}
          ref={ref}
          className={cn(
            'glass-input w-full rounded-xl px-4 py-2.5 text-ink-800 shadow-sm outline-none transition focus:border-primary-300 focus:ring-2 focus:ring-primary-200',
            className,
          )}
          {...rest}
        />
      </div>
    )
  },
)
