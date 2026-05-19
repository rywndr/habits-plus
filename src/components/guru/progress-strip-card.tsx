import { cn } from '#/lib/utils'
import type { Indicator, Trend } from '#/data'
import { StatusBadge } from '#/components/common/status-badge'

const stripColor: Record<Indicator, string> = {
  respons: 'bg-chart-respons',
  interaksi: 'bg-chart-interaksi',
  partisipasi: 'bg-chart-partisipasi',
  regulasi: 'bg-chart-regulasi',
}

type Props = {
  indicator: Indicator
  label: string
  trend: Trend
  className?: string
}

export function ProgressStripCard({ indicator, label, trend, className }: Props) {
  return (
    <div
      className={cn(
        'flex items-stretch overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/5',
        className,
      )}
    >
      <div className={cn('w-2 shrink-0', stripColor[indicator])} />
      <div className="flex flex-1 flex-col gap-1 p-4">
        <span className="text-sm text-foreground">{label}</span>
        <StatusBadge trend={trend} />
      </div>
    </div>
  )
}
