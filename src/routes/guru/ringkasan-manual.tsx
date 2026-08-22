import { useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Badge } from '#/components/ui/badge'
import { Textarea } from '#/components/ui/textarea'
import { SaveButton } from '#/components/common/save-button'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { WeekPicker } from '#/components/guru/week-picker'
import { ClassSelect } from '#/components/guru/class-select'
import {
  AiSummaryPageSkeleton,
  AiSummaryTableSkeleton,
} from '#/components/skeletons/ai-summary-skeleton'
import { loadAiSummaryPage } from '#/server/loaders'
import { saveManualSummaries } from '#/server/actions'
import type { SaveStatus } from '#/components/common/save-button'

export const Route = createFileRoute('/guru/ringkasan-manual')({
  validateSearch: (search = {}) => ({
    weekStart:
      typeof search.weekStart === 'string' ? search.weekStart : undefined,
    classId: typeof search.classId === 'string' ? search.classId : undefined,
  }),
  loaderDeps: ({ search }) => ({
    weekStart: search.weekStart,
    classId: search.classId,
  }),
  loader: ({ deps }) =>
    loadAiSummaryPage({
      data: {
        weekStart: deps.weekStart,
        classId: deps.classId,
      },
    }),
  component: RingkasanManual,
  staleTime: 30_000,
  pendingComponent: AiSummaryPageSkeleton,
  staticData: { title: 'Ringkasan Manual' },
})

function savedContents(
  summaries: Array<{ studentId: string; content: string }>,
) {
  return Object.fromEntries(
    summaries.map((summary) => [summary.studentId, summary.content]),
  )
}

function RingkasanManual() {
  const router = useRouter()
  const navigate = useNavigate()
  const data = Route.useLoaderData()
  const contextKey = `${data.selectedWeekStart}:${data.classId}`

  const [isDataPending, setIsDataPending] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [texts, setTexts] = useState<Record<string, string>>(() =>
    savedContents(data.summaries),
  )

  useEffect(() => {
    setTexts(savedContents(data.summaries))
    setSaveStatus('idle')
    setIsDataPending(false)
  }, [contextKey, data.summaries])

  const pendingNavToken = useRef(0)

  async function navigateTo(next: { weekStart: string; classId: string }) {
    setIsDataPending(true)
    const token = ++pendingNavToken.current
    const startHref = router.state.location.href
    const search = { weekStart: next.weekStart, classId: next.classId }
    try {
      // Preload so the current view stays mounted while the data loads.
      await router.preloadRoute({ to: '/guru/ringkasan-manual', search })
      if (token !== pendingNavToken.current) return
      if (router.state.location.href !== startHref) return
      await navigate({ to: '/guru/ringkasan-manual', search })
    } catch (error) {
      setIsDataPending(false)
      throw error
    }
  }

  const saved = savedContents(data.summaries)
  const changedItems = data.students
    .map((student) => ({
      studentId: student.id,
      content: texts[student.id] ?? '',
    }))
    .filter(
      (item) =>
        item.content.trim() && item.content.trim() !== saved[item.studentId],
    )

  async function handleSave() {
    if (!changedItems.length) return
    setSaveStatus('saving')
    try {
      await saveManualSummaries({
        data: {
          weekStart: data.selectedWeekStart,
          classId: data.classId,
          items: changedItems,
        },
      })
      await router.invalidate()
      setSaveStatus('saved')
    } catch (error) {
      setSaveStatus('error')
      throw error
    }
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader title="Ringkasan Manual untuk Orang Tua" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-heading font-semibold">Minggu:</span>
            <WeekPicker
              value={data.selectedWeekStart}
              onChange={(weekStart) =>
                void navigateTo({ weekStart, classId: data.classId })
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-heading font-semibold">Kelas:</span>
            <ClassSelect
              classes={data.classes}
              value={data.classId}
              onChange={(classId) =>
                void navigateTo({ weekStart: data.selectedWeekStart, classId })
              }
            />
          </div>
        </div>

        {isDataPending ? (
          <AiSummaryTableSkeleton />
        ) : data.students.length ? (
          <div className="flex flex-col gap-3">
            {data.students.map((student) => (
              <div
                key={student.id}
                className="flex flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-foreground/5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-heading font-semibold">{student.name}</p>
                  {student.hasActiveSummary ? (
                    <Badge>Tersimpan</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Belum ada ringkasan
                    </span>
                  )}
                </div>
                <Textarea
                  value={texts[student.id] ?? ''}
                  onChange={(event) => {
                    setTexts((prev) => ({
                      ...prev,
                      [student.id]: event.target.value,
                    }))
                    setSaveStatus('idle')
                  }}
                  rows={3}
                  placeholder={`Tulis ringkasan minggu ini untuk ${student.name}.`}
                  className="rounded-2xl"
                />
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground ring-1 ring-foreground/5">
            Belum ada siswa pada kelas ini.
          </p>
        )}

        <div className="flex justify-end">
          <SaveButton
            status={saveStatus}
            size="lg"
            className="rounded-full px-6"
            statusClassName="self-end"
            onClick={handleSave}
            disabled={isDataPending || !changedItems.length}
          />
        </div>
      </div>
    </ContentPanel>
  )
}
