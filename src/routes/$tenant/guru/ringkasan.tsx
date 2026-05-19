import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Textarea } from '#/components/ui/textarea'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { MonthPicker } from '#/components/guru/month-picker'
import { SummaryRadarPlaceholder } from '#/components/guru/summary-radar-placeholder'
import { ProgressStripCard } from '#/components/guru/progress-strip-card'
import { indicatorLabels } from '#/lib/domain'
import { loadLatestSummary } from '#/server/loaders'
import type { Indicator } from '#/server/tenant-data'

export const Route = createFileRoute('/$tenant/guru/ringkasan')({
  loader: ({ params }) =>
    loadLatestSummary({ data: { tenant: params.tenant } }),
  component: LihatRingkasan,
  staticData: { title: 'Lihat Ringkasan' },
})

const ORDER: Array<Indicator> = [
  'respons',
  'interaksi',
  'partisipasi',
  'regulasi',
]

function LihatRingkasan() {
  const summary = Route.useLoaderData()
  const [month, setMonth] = useState(summary.monthLabel)

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader title="Lihat Ringkasan" />

        <div className="flex items-center gap-2">
          <span className="font-heading font-semibold">Bulan:</span>
          <MonthPicker value={month} onChange={setMonth} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm">Ringkasan dalam bulan</span>
          <Textarea
            value={summary.text}
            readOnly
            rows={2}
            className="rounded-2xl bg-card"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <SummaryRadarPlaceholder />
          <div className="flex flex-col gap-3">
            {ORDER.map((ind) => (
              <ProgressStripCard
                key={ind}
                indicator={ind}
                label={indicatorLabels[ind]}
                trend={summary.trends[ind] ?? 'tidak-terlihat'}
              />
            ))}
          </div>
        </div>
      </div>
    </ContentPanel>
  )
}
