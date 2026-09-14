import { frequencyLabels, indicatorLabels } from '#/lib/domain'
import type { Indicator, StudentWeekDayData } from '#/server/tenant-data'

const INDICATOR_CODES: Array<[Indicator, string]> = [
  ['respons', 'R'],
  ['interaksi', 'I'],
  ['partisipasi', 'P'],
  ['regulasi', 'G'],
]

const dayLabelFormatter = new Intl.DateTimeFormat('id-ID', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
})

type Props = {
  days: Array<StudentWeekDayData>
}

/** The daily observations a weekly report is written from. */
export function WeekObservationStrip({ days }: Props) {
  if (!days.length) {
    return (
      <p className="rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        Belum ada observasi harian pada minggu ini. Laporan masih bisa ditulis
        manual.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 rounded-xl bg-muted/40 p-3">
      <p className="text-xs font-semibold text-muted-foreground">
        Riwayat observasi minggu ini
      </p>
      {days.map((day) => (
        <div
          key={day.date}
          className="flex flex-wrap items-center gap-1.5 text-xs"
        >
          <span className="w-24 shrink-0 font-medium">
            {dayLabelFormatter.format(new Date(day.date))}
          </span>
          {INDICATOR_CODES.map(([indicator, code]) => {
            const frequency = day.scores[indicator]
            return (
              <span
                key={indicator}
                title={indicatorLabels[indicator]}
                className="rounded-full bg-card px-2 py-0.5 ring-1 ring-foreground/10"
              >
                {code}: {frequency ? frequencyLabels[frequency] : '-'}
              </span>
            )
          })}
          {day.note ? (
            <span className="text-muted-foreground">“{day.note}”</span>
          ) : null}
        </div>
      ))}
    </div>
  )
}
