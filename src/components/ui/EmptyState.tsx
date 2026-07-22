import GlassCard from './GlassCard'

interface Props {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export default function EmptyState({ icon, title, description, action }: Props) {
  return (
    <GlassCard variant="soft" className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {icon && (
        <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary-50 text-primary-500">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-ink-700">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </GlassCard>
  )
}
