import { cn } from '#/lib/utils'
import type { Trend } from '#/data'
import { trendLabels } from '#/data'

type Props = {
  trend: Trend
  className?: string
}

const variantMap: Record<Trend, string> = {
  meningkat: 'text-brand-orange',
  stabil: 'text-brand-navy',
  menurun: 'text-destructive',
  'tidak-terlihat': 'text-muted-foreground',
}

export function StatusBadge({ trend, className }: Props) {
  return (
    <span
      className={cn(
        'font-heading text-base font-bold tracking-wide',
        variantMap[trend],
        className,
      )}
    >
      {trendLabels[trend]}
    </span>
  )
}
