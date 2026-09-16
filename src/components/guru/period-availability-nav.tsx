import { Button } from '#/components/ui/button'
import type { PeriodAvailability } from '#/lib/period-availability'

type Props = {
  availability: PeriodAvailability
  selectedPeriod: string
  formatPeriod: (period: string) => string
  onOpenLatest: (period: string) => void
}

export function PeriodAvailabilityNav({
  availability,
  selectedPeriod,
  formatPeriod,
  onOpenLatest,
}: Props) {
  const latest = availability.latestPeriod
  if (!latest || latest === selectedPeriod) return null

  return (
    <div className="flex flex-col gap-2 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground">
        {!availability.selectedHasData && (
          <span className="text-foreground">
            Belum ada data pada periode ini.{' '}
          </span>
        )}
        Data terakhir: {formatPeriod(latest)}
      </p>
      <Button
        type="button"
        variant="link"
        size="sm"
        className="h-auto self-start px-0 sm:self-auto"
        onClick={() => onOpenLatest(latest)}
      >
        Buka data terakhir
      </Button>
    </div>
  )
}
