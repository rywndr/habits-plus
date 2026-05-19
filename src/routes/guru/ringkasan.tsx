import { useEffect, useState } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Save } from 'lucide-react'
import { Textarea } from '#/components/ui/textarea'
import { Button } from '#/components/ui/button'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { MonthPicker } from '#/components/guru/month-picker'
import { SummaryRadarChart } from '#/components/guru/summary-radar-chart'
import { ProgressStripCard } from '#/components/guru/progress-strip-card'
import { frequencyLabels, indicatorLabels } from '#/lib/domain'
import { loadLatestSummary } from '#/server/loaders'
import { saveMonthlySummary } from '#/server/actions'
import { SummaryPageSkeleton } from '#/components/skeletons/summary-page-skeleton'
import type { Indicator } from '#/server/tenant-data'

export const Route = createFileRoute('/guru/ringkasan')({
  validateSearch: (search = {}) => ({
    month: typeof search.month === 'string' ? search.month : undefined,
  }),
  loaderDeps: ({ search }) => ({
    month: search.month,
  }),
  loader: ({ context, deps }) =>
    loadLatestSummary({
      data: { tenant: context.user.tenantSlug, month: deps.month },
    }),
  component: LihatRingkasan,
  pendingComponent: SummaryPageSkeleton,
  staticData: { title: 'Lihat Ringkasan' },
})

const ORDER: Array<Indicator> = [
  'respons',
  'interaksi',
  'partisipasi',
  'regulasi',
]

function LihatRingkasan() {
  const router = useRouter()
  const navigate = useNavigate()
  const summary = Route.useLoaderData()
  const search = Route.useSearch()
  const [month, setMonth] = useState(search.month ?? summary.month)
  const [text, setText] = useState(summary.text)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>(
    'idle',
  )

  useEffect(() => {
    setMonth(search.month ?? summary.month)
    setText(summary.text)
    setSaveStatus('idle')
  }, [search.month, summary.month, summary.text])

  async function handleMonthChange(nextMonth: string) {
    setMonth(nextMonth)
    await navigate({ to: '/guru/ringkasan', search: { month: nextMonth } })
  }

  async function handleSave() {
    setSaveStatus('saving')
    try {
      await saveMonthlySummary({ data: { month, text } })
      await router.invalidate()
      setSaveStatus('saved')
    } catch (error) {
      setSaveStatus('idle')
      throw error
    }
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader title="Lihat Ringkasan" />

        <div className="flex items-center gap-2">
          <span className="font-heading font-semibold">Bulan:</span>
          <MonthPicker value={month} onChange={handleMonthChange} />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm">Ringkasan dalam bulan</span>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <Textarea
              value={text}
              onChange={(event) => {
                setText(event.target.value)
                setSaveStatus('idle')
              }}
              rows={2}
              placeholder="Tulis ringkasan perkembangan siswa untuk bulan ini."
              className="rounded-2xl bg-card"
            />
            <Button
              size="lg"
              className="gap-2 rounded-full sm:mt-1"
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
            >
              {saveStatus === 'saving'
                ? 'MENYIMPAN'
                : saveStatus === 'saved'
                  ? 'TERSIMPAN'
                  : 'SIMPAN'}
              <Save />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <SummaryRadarChart data={summary.radar} />
          <div className="flex flex-col gap-3">
            {ORDER.map((ind) => (
              <ProgressStripCard
                key={ind}
                indicator={ind}
                label={indicatorLabels[ind]}
                trend={summary.trends[ind] ?? 'tidak-terlihat'}
                valueLabel={
                  summary.averages[ind]
                    ? frequencyLabels[summary.averages[ind]]
                    : 'Tidak Terlihat'
                }
              />
            ))}
          </div>
        </div>
      </div>
    </ContentPanel>
  )
}
