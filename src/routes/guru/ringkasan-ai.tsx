import { useEffect, useRef, useState } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { Check, LoaderCircle, Sparkles } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { WeekPicker } from '#/components/guru/week-picker'
import { DatePicker } from '#/components/guru/date-picker'
import { ClassSelect } from '#/components/guru/class-select'
import { AiStudentsTable } from '#/components/guru/ai-students-table'
import { AiDraftReviewCard } from '#/components/guru/ai-draft-review-card'
import { AiSavedSummaries } from '#/components/guru/ai-saved-summaries'
import { AiCostHistory } from '#/components/guru/ai-cost-history'
import {
  AiSummaryPageSkeleton,
  AiSummaryTableSkeleton,
} from '#/components/skeletons/ai-summary-skeleton'
import { formatUsd } from '#/lib/format'
import { loadAiSummaryPage } from '#/server/loaders'
import {
  acceptAiSummaries,
  deleteAiSummary,
  generateAiSummaries,
  revokeAiSummary,
} from '#/server/actions'
import type { GenerateBatchCost } from '#/server/actions'

export const Route = createFileRoute('/guru/ringkasan-ai')({
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
  component: RingkasanAi,
  staleTime: 30_000,
  pendingComponent: AiSummaryPageSkeleton,
  staticData: { title: 'Ringkasan AI' },
})

type Tab = 'generate' | 'tersimpan' | 'biaya'

function addCost(
  a: GenerateBatchCost,
  b: GenerateBatchCost,
): GenerateBatchCost {
  return {
    promptTokens: a.promptTokens + b.promptTokens,
    cachedTokens: a.cachedTokens + b.cachedTokens,
    completionTokens: a.completionTokens + b.completionTokens,
    costUsd: a.costUsd + b.costUsd,
  }
}

function RingkasanAi() {
  const router = useRouter()
  const navigate = useNavigate()
  const data = Route.useLoaderData()
  const contextKey = `${data.selectedWeekStart}:${data.classId}`

  const [tab, setTab] = useState<Tab>('generate')
  const [isDataPending, setIsDataPending] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  // Drafts are keyed by week+class so paid generations survive navigation.
  const [draftsByContext, setDraftsByContext] = useState<
    Record<string, Record<string, string>>
  >({})
  const [notices, setNotices] = useState<Record<string, string>>({})
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set())
  const [isAccepting, setIsAccepting] = useState(false)
  const [sessionCost, setSessionCost] = useState<GenerateBatchCost | null>(
    null,
  )

  const drafts = draftsByContext[contextKey] ?? {}
  const draftIds = Object.keys(drafts)
  const isGenerating = generatingIds.size > 0

  useEffect(() => {
    setSelected(new Set())
    setNotices({})
    setIsDataPending(false)
  }, [contextKey])

  const pendingNavToken = useRef(0)

  async function navigateTo(next: { weekStart: string; classId: string }) {
    setIsDataPending(true)
    const token = ++pendingNavToken.current
    const startHref = router.state.location.href
    const search = { weekStart: next.weekStart, classId: next.classId }
    try {
      // Preload so the current view stays mounted while the data loads,
      // instead of the route-level pendingComponent replacing the page.
      await router.preloadRoute({ to: '/guru/ringkasan-ai', search })
      if (token !== pendingNavToken.current) return
      if (router.state.location.href !== startHref) return
      await navigate({ to: '/guru/ringkasan-ai', search })
    } catch (error) {
      setIsDataPending(false)
      throw error
    }
  }

  const eligibleStudents = data.students.filter(
    (student) => !student.hasActiveSummary && student.observedDays > 0,
  )
  const allEligibleSelected =
    eligibleStudents.length > 0 &&
    eligibleStudents.every((student) => selected.has(student.id))

  function toggleStudent(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelected(
      allEligibleSelected
        ? new Set()
        : new Set(eligibleStudents.map((student) => student.id)),
    )
  }

  async function runGeneration(studentIds: Array<string>) {
    if (!studentIds.length || isGenerating) return
    setGeneratingIds(new Set(studentIds))
    setNotices((prev) => {
      const next = { ...prev }
      for (const id of studentIds) delete next[id]
      return next
    })
    try {
      const result = await generateAiSummaries({
        data: {
          weekStart: data.selectedWeekStart,
          classId: data.classId,
          studentIds,
        },
      })

      setDraftsByContext((prev) => {
        const current = { ...(prev[contextKey] ?? {}) }
        for (const draft of result.drafts) {
          if (draft.content) current[draft.studentId] = draft.content
        }
        return { ...prev, [contextKey]: current }
      })
      setNotices((prev) => {
        const next = { ...prev }
        for (const draft of result.drafts) {
          if (draft.error) next[draft.studentId] = draft.error
        }
        for (const skip of result.skipped) {
          next[skip.studentId] = skip.reason
        }
        return next
      })
      if (result.cost) {
        const cost = result.cost
        setSessionCost((prev) => (prev ? addCost(prev, cost) : cost))
      }
      setSelected(new Set())
    } finally {
      setGeneratingIds(new Set())
    }
  }

  async function acceptDrafts(studentIds: Array<string>) {
    const items = studentIds
      .filter((id) => drafts[id])
      .map((id) => ({ studentId: id, content: drafts[id] }))
    if (!items.length || isAccepting) return
    setIsAccepting(true)
    try {
      await acceptAiSummaries({
        data: {
          weekStart: data.selectedWeekStart,
          classId: data.classId,
          items,
        },
      })
      await router.invalidate()
      discardDrafts(items.map((item) => item.studentId))
    } finally {
      setIsAccepting(false)
    }
  }

  function discardDrafts(studentIds: Array<string>) {
    setDraftsByContext((prev) => {
      const current = { ...(prev[contextKey] ?? {}) }
      for (const id of studentIds) delete current[id]
      return { ...prev, [contextKey]: current }
    })
  }

  async function handleRevoke(id: string) {
    await revokeAiSummary({ data: { id } })
    await router.invalidate()
  }

  async function handleDelete(id: string) {
    await deleteAiSummary({ data: { id } })
    await router.invalidate()
  }

  const studentName = (id: string) =>
    data.students.find((student) => student.id === id)?.name ?? 'Siswa'

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader title="Ringkasan AI untuk Orang Tua" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-heading font-semibold">Minggu:</span>
            <WeekPicker
              value={data.selectedWeekStart}
              onChange={(weekStart) =>
                void navigateTo({ weekStart, classId: data.classId })
              }
            />
            <DatePicker
              value={data.selectedWeekStart}
              onChange={(date) =>
                void navigateTo({ weekStart: date, classId: data.classId })
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

        <div className="flex flex-wrap gap-2">
          <TabButton
            label="Generate"
            active={tab === 'generate'}
            onClick={() => setTab('generate')}
          />
          <TabButton
            label={`Tersimpan (${data.summaries.length})`}
            active={tab === 'tersimpan'}
            onClick={() => setTab('tersimpan')}
          />
          <TabButton
            label="Riwayat Biaya"
            active={tab === 'biaya'}
            onClick={() => setTab('biaya')}
          />
        </div>

        {isDataPending ? (
          <AiSummaryTableSkeleton />
        ) : tab === 'generate' ? (
          <div className="flex flex-col gap-4">
            <AiStudentsTable
              students={data.students}
              selected={selected}
              allSelected={allEligibleSelected}
              hasEligible={eligibleStudents.length > 0}
              generatingIds={generatingIds}
              draftIds={new Set(draftIds)}
              notices={notices}
              onToggle={toggleStudent}
              onToggleAll={toggleAll}
            />

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">
                {selected.size} siswa dipilih
                {sessionCost ? (
                  <>
                    {' · '}Biaya sesi ini:{' '}
                    <span className="font-semibold text-foreground">
                      {formatUsd(sessionCost.costUsd)}
                    </span>{' '}
                    ({sessionCost.promptTokens + sessionCost.completionTokens}{' '}
                    token)
                  </>
                ) : null}
              </p>
              <Button
                size="lg"
                className="gap-2 rounded-full px-6"
                disabled={!selected.size || isGenerating}
                aria-busy={isGenerating}
                onClick={() => void runGeneration([...selected])}
              >
                {isGenerating ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                Generate ringkasan
              </Button>
            </div>

            {draftIds.length ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-lg font-semibold">
                    Tinjau draf ({draftIds.length})
                  </h2>
                  <Button
                    variant="secondary"
                    className="gap-2 rounded-full"
                    disabled={isAccepting || isGenerating}
                    onClick={() => void acceptDrafts(draftIds)}
                  >
                    <Check className="size-4" />
                    Terima semua
                  </Button>
                </div>
                {draftIds.map((studentId) => (
                  <AiDraftReviewCard
                    key={studentId}
                    name={studentName(studentId)}
                    content={drafts[studentId]}
                    days={data.weekData[studentId] ?? []}
                    busy={isAccepting || generatingIds.has(studentId)}
                    onAccept={() => void acceptDrafts([studentId])}
                    onDeny={() => discardDrafts([studentId])}
                    onRerun={() => void runGeneration([studentId])}
                  />
                ))}
              </div>
            ) : null}

            {Object.entries(notices).length ? (
              <div className="flex flex-col gap-1 rounded-2xl bg-destructive/5 px-4 py-3 text-sm text-destructive">
                {Object.entries(notices).map(([studentId, reason]) => (
                  <p key={studentId}>
                    <span className="font-semibold">
                      {studentName(studentId)}:
                    </span>{' '}
                    {reason}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
        ) : tab === 'tersimpan' ? (
          <AiSavedSummaries
            summaries={data.summaries}
            onRevoke={handleRevoke}
            onDelete={handleDelete}
          />
        ) : (
          <AiCostHistory history={data.history} />
        )}
      </div>
    </ContentPanel>
  )
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <Button
      variant={active ? 'default' : 'secondary'}
      className="rounded-full"
      onClick={onClick}
    >
      {label}
    </Button>
  )
}
