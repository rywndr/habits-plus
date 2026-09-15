import { affectsReports } from '#/lib/route-invalidation'
import { useMemo, useRef, useState } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { LoaderCircle, Sparkles } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { ContentPanel } from '#/components/shell/content-panel'
import { HeaderFilter, HeaderFilters } from '#/components/guru/header-filters'
import { PageHeader } from '#/components/shell/page-header'
import { WeekPicker } from '#/components/guru/week-picker'
import { DatePicker } from '#/components/guru/date-picker'
import { ClassSelect } from '#/components/guru/class-select'
import {
  ParentReportRow,
  isGeneratable,
  reportRowState,
} from '#/components/guru/parent-report-row'
import {
  ParentReportPageSkeleton,
  ParentReportTableSkeleton,
} from '#/components/skeletons/parent-report-skeleton'
import { loadParentReportPage } from '#/server/loaders'
import {
  acceptAiSummaries,
  deleteAiSummary,
  generateAiSummaries,
  revokeAiSummary,
  saveManualSummaries,
} from '#/server/actions'

export const Route = createFileRoute('/guru/laporan-orang-tua')({
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
    loadParentReportPage({
      data: {
        weekStart: deps.weekStart,
        classId: deps.classId,
      },
    }),
  component: LaporanOrangTua,
  staleTime: 30_000,
  pendingComponent: ParentReportPageSkeleton,
  staticData: { title: 'Laporan Orang Tua' },
})

function LaporanOrangTua() {
  const router = useRouter()
  const navigate = useNavigate()
  const data = Route.useLoaderData()
  const contextKey = `${data.selectedWeekStart}:${data.classId}`

  const [isDataPending, setIsDataPending] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set())
  const [savingId, setSavingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [notices, setNotices] = useState<Record<string, string>>({})
  // Drafts and in-progress edits are keyed by week+class so a paid generation
  // survives switching context and coming back.
  const [draftsByContext, setDraftsByContext] = useState<
    Record<string, Record<string, string>>
  >({})
  const [editsByContext, setEditsByContext] = useState<
    Record<string, Record<string, string>>
  >({})

  const drafts = draftsByContext[contextKey] ?? {}
  const edits = editsByContext[contextKey] ?? {}
  const isGenerating = generatingIds.size > 0

  const summaryByStudent = useMemo(
    () => new Map(data.summaries.map((item) => [item.studentId, item])),
    [data.summaries],
  )

  const rows = data.students.map((student) => {
    const state = reportRowState({
      isGenerating: generatingIds.has(student.id),
      summary: summaryByStudent.get(student.id),
      draft: drafts[student.id],
    })
    // Server data is the default; the edit buffer only holds what was typed.
    const fallback =
      state.kind === 'saved'
        ? state.summary.content
        : state.kind === 'draft'
          ? state.content
          : ''
    return {
      student,
      state,
      text: edits[student.id] ?? fallback,
    }
  })

  const generatable = rows.filter((row) =>
    isGeneratable(row.student, row.state),
  )
  const allGeneratableSelected =
    generatable.length > 0 &&
    generatable.every((row) => selected.has(row.student.id))
  const savedCount = rows.filter((row) => row.state.kind === 'saved').length

  function patchContext(
    setState: React.Dispatch<
      React.SetStateAction<Record<string, Record<string, string>>>
    >,
    update: (current: Record<string, string>) => Record<string, string>,
  ) {
    setState((prev) => ({
      ...prev,
      [contextKey]: update(prev[contextKey] ?? {}),
    }))
  }

  function setEdit(studentId: string, value: string) {
    patchContext(setEditsByContext, (current) => ({
      ...current,
      [studentId]: value,
    }))
  }

  function clearEdit(studentId: string) {
    patchContext(setEditsByContext, (current) => {
      const next = { ...current }
      delete next[studentId]
      return next
    })
  }

  function discardDrafts(studentIds: Array<string>) {
    patchContext(setDraftsByContext, (current) => {
      const next = { ...current }
      for (const id of studentIds) delete next[id]
      return next
    })
  }

  function setNotice(studentId: string, reason: string | undefined) {
    setNotices((prev) => {
      const next = { ...prev }
      if (reason) next[studentId] = reason
      else delete next[studentId]
      return next
    })
  }

  const pendingNavToken = useRef(0)

  async function navigateTo(next: { weekStart: string; classId: string }) {
    setIsDataPending(true)
    const token = ++pendingNavToken.current
    const startHref = router.state.location.href
    const search = { weekStart: next.weekStart, classId: next.classId }
    try {
      // Preload so the current view stays mounted while the data loads,
      // instead of the route-level pendingComponent replacing the page.
      await router.preloadRoute({ to: '/guru/laporan-orang-tua', search })
      if (token !== pendingNavToken.current) return
      if (router.state.location.href !== startHref) return
      await navigate({ to: '/guru/laporan-orang-tua', search })
      setSelected(new Set())
      setExpandedId(null)
    } catch (error) {
      setIsDataPending(false)
      throw error
    } finally {
      setIsDataPending(false)
    }
  }

  async function runGeneration(studentIds: Array<string>) {
    if (!studentIds.length || isGenerating) return
    setGeneratingIds(new Set(studentIds))
    for (const id of studentIds) setNotice(id, undefined)
    try {
      const result = await generateAiSummaries({
        data: {
          weekStart: data.selectedWeekStart,
          classId: data.classId,
          studentIds,
        },
      })

      patchContext(setDraftsByContext, (current) => {
        const next = { ...current }
        for (const draft of result.drafts) {
          if (draft.content) next[draft.studentId] = draft.content
        }
        return next
      })
      // A regenerated draft replaces whatever the teacher had in the box.
      for (const draft of result.drafts) {
        if (draft.content) clearEdit(draft.studentId)
        if (draft.error) setNotice(draft.studentId, draft.error)
      }
      for (const skip of result.skipped) setNotice(skip.studentId, skip.reason)
      setSelected(new Set())
      if (studentIds.length === 1) setExpandedId(studentIds[0])
    } finally {
      setGeneratingIds(new Set())
    }
  }

  /**
   * An untouched draft keeps its AI provenance. An edited one is saved through
   * the manual path so the stored `model` reflects who actually wrote it.
   */
  async function acceptDraft(studentId: string, text: string) {
    const draft = drafts[studentId]
    if (draft === undefined || !text.trim()) return
    setSavingId(studentId)
    try {
      const items = [{ studentId, content: text }]
      if (text.trim() === draft.trim()) {
        const result = await acceptAiSummaries({
          data: {
            weekStart: data.selectedWeekStart,
            classId: data.classId,
            items,
          },
        })
        for (const skip of result.skipped)
          setNotice(skip.studentId, skip.reason)
        // Only drop drafts the server actually stored.
        if (!result.saved.includes(studentId)) return
      } else {
        await saveManualSummaries({
          data: {
            weekStart: data.selectedWeekStart,
            classId: data.classId,
            items,
          },
        })
      }
      await router.invalidate({ filter: affectsReports })
      discardDrafts([studentId])
      clearEdit(studentId)
      setNotice(studentId, undefined)
    } finally {
      setSavingId(null)
    }
  }

  async function saveManual(studentId: string, text: string) {
    if (!text.trim()) return
    setSavingId(studentId)
    try {
      await saveManualSummaries({
        data: {
          weekStart: data.selectedWeekStart,
          classId: data.classId,
          items: [{ studentId, content: text }],
        },
      })
      await router.invalidate({ filter: affectsReports })
      clearEdit(studentId)
      setNotice(studentId, undefined)
    } finally {
      setSavingId(null)
    }
  }

  async function handleRevoke(id: string, studentId: string) {
    setSavingId(studentId)
    try {
      await revokeAiSummary({ data: { id } })
      await router.invalidate({ filter: affectsReports })
      clearEdit(studentId)
    } finally {
      setSavingId(null)
    }
  }

  async function handleDelete(id: string, studentId: string) {
    setSavingId(studentId)
    try {
      await deleteAiSummary({ data: { id } })
      await router.invalidate({ filter: affectsReports })
      clearEdit(studentId)
    } finally {
      setSavingId(null)
    }
  }

  function toggleSelectAll() {
    setSelected(
      allGeneratableSelected
        ? new Set()
        : new Set(generatable.map((row) => row.student.id)),
    )
  }

  const deletingRow = rows.find(
    (row) => row.state.kind === 'saved' && row.student.id === deletingId,
  )

  return (
    <ContentPanel className="min-w-0">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <PageHeader
            title="Laporan Orang Tua"
            className="text-2xl leading-tight sm:text-4xl"
          />
          <p className="text-sm text-muted-foreground">
            Laporan mingguan per siswa. Buat dengan AI dari observasi harian,
            atau tulis sendiri.
          </p>
        </div>

        <HeaderFilters>
          <HeaderFilter label="Minggu">
            <WeekPicker
              value={data.selectedWeekStart}
              onChange={(weekStart) =>
                void navigateTo({ weekStart, classId: data.classId })
              }
            />
          </HeaderFilter>
          <HeaderFilter label="Tanggal acuan">
            <DatePicker
              value={data.selectedWeekStart}
              onChange={(date) =>
                void navigateTo({ weekStart: date, classId: data.classId })
              }
            />
          </HeaderFilter>
          <HeaderFilter
            label="Kelas"
            className="flex-1 lg:min-w-36 lg:flex-none"
          >
            <ClassSelect
              classes={data.classes}
              value={data.classId}
              onChange={(classId) =>
                void navigateTo({ weekStart: data.selectedWeekStart, classId })
              }
            />
          </HeaderFilter>
        </HeaderFilters>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {savedCount} dari {rows.length} laporan sudah terkirim
            {selected.size ? ` · ${selected.size} dipilih` : ''}
          </p>
          <Button
            size="lg"
            className="min-h-11 gap-2 rounded-full px-6 sm:min-h-0"
            disabled={!selected.size || isGenerating}
            aria-busy={isGenerating}
            onClick={() => void runGeneration([...selected])}
          >
            {isGenerating ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Sparkles />
            )}
            Buat dengan AI ({selected.size})
          </Button>
        </div>

        {isDataPending ? (
          <ParentReportTableSkeleton />
        ) : rows.length ? (
          <div className="min-w-0 rounded-xl bg-card ring-1 ring-foreground/5">
            <Table className="max-sm:block">
              <TableHeader className="max-sm:block">
                <TableRow className="border-0 bg-brand-table-header hover:bg-brand-table-header max-sm:grid max-sm:grid-cols-[4rem_minmax(0,1fr)] max-sm:items-center">
                  <TableHead className="w-16 text-center max-sm:h-auto max-sm:min-h-11 sm:w-12">
                    <label className="flex min-h-11 items-center justify-center">
                      <input
                        type="checkbox"
                        aria-label="Pilih semua siswa yang bisa dibuat dengan AI"
                        className="size-5 accent-brand-orange sm:size-4"
                        checked={allGeneratableSelected}
                        onChange={toggleSelectAll}
                        disabled={!generatable.length}
                      />
                    </label>
                  </TableHead>
                  <TableHead className="text-brand-navy-foreground max-sm:flex max-sm:min-h-11 max-sm:items-center max-sm:pl-8">
                    Nama
                  </TableHead>
                  <TableHead className="hidden w-36 text-center text-brand-navy-foreground sm:table-cell">
                    Hari terobservasi
                  </TableHead>
                  <TableHead className="hidden w-48 text-center text-brand-navy-foreground sm:table-cell">
                    Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="max-sm:block">
                {rows.map(({ student, state, text }) => (
                  <ParentReportRow
                    key={student.id}
                    student={student}
                    state={state}
                    days={data.weekData[student.id] ?? []}
                    text={text}
                    notice={notices[student.id]}
                    isSelected={selected.has(student.id)}
                    isExpanded={expandedId === student.id}
                    isSaving={savingId === student.id}
                    actions={{
                      onToggleSelect: () =>
                        setSelected((prev) => {
                          const next = new Set(prev)
                          if (next.has(student.id)) next.delete(student.id)
                          else next.add(student.id)
                          return next
                        }),
                      onToggleExpand: () =>
                        setExpandedId((prev) =>
                          prev === student.id ? null : student.id,
                        ),
                      onTextChange: (value) => setEdit(student.id, value),
                      onGenerate: () => void runGeneration([student.id]),
                      onAcceptDraft: () => void acceptDraft(student.id, text),
                      onDiscardDraft: () => {
                        discardDrafts([student.id])
                        clearEdit(student.id)
                      },
                      onSaveManual: () => void saveManual(student.id, text),
                      onRevoke: () => {
                        if (state.kind === 'saved') {
                          void handleRevoke(state.summary.id, student.id)
                        }
                      },
                      onDelete: () => setDeletingId(student.id),
                    }}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground ring-1 ring-foreground/5">
            Belum ada siswa pada kelas ini.
          </p>
        )}
      </div>

      <Dialog
        open={deletingId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus laporan ini?</DialogTitle>
            <DialogDescription>
              Laporan akan dihapus permanen dan tidak lagi tampil untuk orang
              tua. Siswa dapat dibuat ulang untuk minggu ini.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="secondary" />}>
              Batal
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => {
                if (deletingRow?.state.kind === 'saved') {
                  void handleDelete(
                    deletingRow.state.summary.id,
                    deletingRow.student.id,
                  )
                }
                setDeletingId(null)
              }}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ContentPanel>
  )
}
