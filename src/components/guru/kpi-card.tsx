import type { LucideIcon } from 'lucide-react'
import { cn } from '#/lib/utils'

type Props = {
  label: string
  value: string
  icon: LucideIcon
  className?: string
}

export function KpiCard({ label, value, icon: Icon, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col gap-6 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/5',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs leading-tight text-muted-foreground sm:text-sm">
          {label}
        </span>
        <span className="rounded-md bg-brand-orange/15 p-1.5 text-brand-orange">
          <Icon className="size-5" />
        </span>
      </div>
      <span className="font-heading text-base font-bold tracking-wide text-brand-orange sm:text-lg">
        {value.toUpperCase()}
      </span>
    </div>
  )
}
