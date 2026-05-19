import { indicatorLabels } from '#/data'

const seriesColor: Record<keyof typeof indicatorLabels, string> = {
  respons: 'bg-chart-respons',
  interaksi: 'bg-chart-interaksi',
  partisipasi: 'bg-chart-partisipasi',
  regulasi: 'bg-chart-regulasi',
}

export function SummaryRadarPlaceholder() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl p-4">
      <ul className="grid grid-cols-1 gap-1.5 self-start text-xs">
        {Object.entries(indicatorLabels).map(([key, label]) => (
          <li key={key} className="flex items-center gap-2">
            <span
              className={`inline-block size-3 rounded-full ${seriesColor[key as keyof typeof indicatorLabels]}`}
            />
            <span className="text-muted-foreground">{label}</span>
          </li>
        ))}
      </ul>
      <div
        className="grid w-full max-w-sm place-items-center rounded-lg border border-dashed border-border bg-card/40 text-xs text-muted-foreground"
        style={{ aspectRatio: '1 / 1' }}
      >
        <span className="px-4 text-center">
          [Radar chart placeholder — Minggu ke-1…4]
        </span>
      </div>
    </div>
  )
}
