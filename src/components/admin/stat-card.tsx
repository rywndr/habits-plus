import type { LucideIcon } from 'lucide-react'

type Props = {
  label: string
  value: number
  icon: LucideIcon
}

export function StatCard({ label, value, icon: Icon }: Props) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/5">
      <div className="grid size-12 place-items-center rounded-xl bg-brand-navy text-brand-navy-foreground">
        <Icon className="size-5" />
      </div>
      <div className="flex flex-col">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="font-heading text-2xl font-semibold text-foreground">
          {value}
        </span>
      </div>
    </div>
  )
}
