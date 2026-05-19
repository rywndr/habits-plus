import { StatusBadge } from '#/components/common/status-badge'
import type { Trend } from '#/data'

type Props = {
  label: string
  trend: Trend
  graphic: string
}

export function ProgressGraphicCard({ label, trend, graphic }: Props) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="grid size-36 place-items-center overflow-hidden rounded-full bg-brand-navy p-4">
        <img
          src={graphic}
          alt=""
          className="size-full object-contain"
          loading="lazy"
        />
      </div>
      <div className="flex w-full flex-1 flex-col items-center gap-3 rounded-2xl bg-card p-4 text-center shadow-sm ring-1 ring-foreground/5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <StatusBadge trend={trend} />
      </div>
    </div>
  )
}
