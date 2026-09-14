import { Fragment } from 'react'
import {
  Check,
  ChevronDown,
  LoaderCircle,
  RotateCcw,
  Sparkles,
  Trash2,
  Undo2,
  X,
} from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Textarea } from '#/components/ui/textarea'
import { TableCell, TableRow } from '#/components/ui/table'
import { cn } from '#/lib/utils'
import { WeekObservationStrip } from './week-observation-strip'
import type { AiSummaryListItem, StudentWeekDayData } from '#/server/tenant-data'

/** Columns in the report table, so the detail row can span all of them. */
export const REPORT_COLUMN_COUNT = 4

export type ParentReportStudent = {
  id: string
  name: string
  observedDays: number
}

/**
 * A student is in exactly one report state for the selected week. Modelling it
 * as a union keeps the badge and the button set from drifting apart.
 */
export type ReportRowState =
  | { kind: 'generating' }
  | { kind: 'saved'; summary: AiSummaryListItem }
  | { kind: 'draft'; content: string }
  | { kind: 'empty' }

export function reportRowState(input: {
  isGenerating: boolean
  summary: AiSummaryListItem | undefined
  draft: string | undefined
}): ReportRowState {
  if (input.isGenerating) return { kind: 'generating' }
  if (input.summary) return { kind: 'saved', summary: input.summary }
  if (input.draft !== undefined) return { kind: 'draft', content: input.draft }
  return { kind: 'empty' }
}

/** Only students with observations and no report yet can be generated. */
export function isGeneratable(
  student: ParentReportStudent,
  state: ReportRowState,
) {
  return state.kind === 'empty' && student.observedDays > 0
}

function RowStatus({
  state,
  observedDays,
}: {
  state: ReportRowState
  observedDays: number
}) {
  switch (state.kind) {
    case 'generating':
      return (
        <Badge variant="secondary">
          <LoaderCircle className="animate-spin" />
          Membuat
        </Badge>
      )
    case 'saved':
      return (
        <Badge>
          {state.summary.source === 'manual' ? 'Tersimpan · Manual' : 'Tersimpan · AI'}
        </Badge>
      )
    case 'draft':
      return <Badge variant="secondary">Draf, belum dikirim</Badge>
    case 'empty':
      return (
        <Badge variant="outline">
          {observedDays === 0 ? 'Tanpa observasi' : 'Belum ada'}
        </Badge>
      )
    default: {
      const unhandled: never = state
      return unhandled
    }
  }
}

type Actions = {
  onToggleSelect: () => void
  onToggleExpand: () => void
  onTextChange: (value: string) => void
  onGenerate: () => void
  onAcceptDraft: () => void
  onDiscardDraft: () => void
  onSaveManual: () => void
  onRevoke: () => void
  onDelete: () => void
}

type Props = {
  student: ParentReportStudent
  state: ReportRowState
  days: Array<StudentWeekDayData>
  text: string
  notice: string | undefined
  isSelected: boolean
  isExpanded: boolean
  isSaving: boolean
  actions: Actions
}

export function ParentReportRow({
  student,
  state,
  days,
  text,
  notice,
  isSelected,
  isExpanded,
  isSaving,
  actions,
}: Props) {
  const detailId = `laporan-${student.id}`
  const selectable = isGeneratable(student, state)
  const busy = isSaving || state.kind === 'generating'
  const trimmed = text.trim()

  return (
    <Fragment>
      <TableRow className={cn(isExpanded && 'bg-muted/30')}>
        <TableCell className="text-center">
          <input
            type="checkbox"
            aria-label={`Pilih ${student.name}`}
            className="size-4 accent-brand-orange"
            checked={isSelected}
            onChange={actions.onToggleSelect}
            disabled={!selectable}
          />
        </TableCell>
        <TableCell>
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={isExpanded ? detailId : undefined}
            onClick={actions.onToggleExpand}
            className="flex w-full items-center gap-2 text-left font-medium hover:text-brand-navy"
          >
            <ChevronDown
              aria-hidden
              className={cn(
                'size-4 shrink-0 text-muted-foreground transition-transform',
                isExpanded && 'rotate-180',
              )}
            />
            <span className="truncate">{student.name}</span>
          </button>
        </TableCell>
        <TableCell className="text-center whitespace-nowrap">
          {student.observedDays} hari
        </TableCell>
        <TableCell className="text-center">
          <RowStatus state={state} observedDays={student.observedDays} />
        </TableCell>
      </TableRow>

      {isExpanded ? (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={REPORT_COLUMN_COUNT} className="p-4">
            <div id={detailId} className="flex flex-col gap-3">
              <WeekObservationStrip days={days} />

              {notice ? (
                <p className="rounded-xl bg-destructive/5 px-3 py-2 text-xs text-destructive">
                  {notice}
                </p>
              ) : null}

              <Textarea
                value={text}
                onChange={(event) => actions.onTextChange(event.target.value)}
                rows={4}
                disabled={busy}
                aria-label={`Laporan untuk ${student.name}`}
                placeholder={`Tulis laporan minggu ini untuk ${student.name}, atau buat dengan AI.`}
                className="rounded-2xl bg-card"
              />

              <RowActions
                state={state}
                text={trimmed}
                busy={busy}
                canGenerate={student.observedDays > 0}
                actions={actions}
              />
            </div>
          </TableCell>
        </TableRow>
      ) : null}
    </Fragment>
  )
}

function RowActions({
  state,
  text,
  busy,
  canGenerate,
  actions,
}: {
  state: ReportRowState
  text: string
  busy: boolean
  canGenerate: boolean
  actions: Actions
}) {
  switch (state.kind) {
    case 'generating':
      return (
        <p className="text-xs text-muted-foreground">
          Sedang membuat laporan dengan AI.
        </p>
      )

    case 'saved':
      return (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="ghost"
            className="gap-1 text-destructive"
            disabled={busy}
            onClick={actions.onDelete}
          >
            <Trash2 />
            Hapus
          </Button>
          <Button
            variant="ghost"
            className="gap-1 text-brand-orange"
            disabled={busy}
            onClick={actions.onRevoke}
          >
            <Undo2 />
            Cabut dari orang tua
          </Button>
          <Button
            className="gap-1 rounded-full px-5"
            disabled={busy || !text || text === state.summary.content.trim()}
            onClick={actions.onSaveManual}
          >
            <Check />
            Simpan perubahan
          </Button>
        </div>
      )

    case 'draft':
      return (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="ghost"
            className="gap-1 text-destructive"
            disabled={busy}
            onClick={actions.onDiscardDraft}
          >
            <X />
            Buang draf
          </Button>
          <Button
            variant="secondary"
            className="gap-1 rounded-full"
            disabled={busy}
            onClick={actions.onGenerate}
          >
            <RotateCcw />
            Buat ulang
          </Button>
          <Button
            className="gap-1 rounded-full px-5"
            disabled={busy || !text}
            onClick={actions.onAcceptDraft}
          >
            <Check />
            Kirim ke orang tua
          </Button>
        </div>
      )

    case 'empty':
      return (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            variant="secondary"
            className="gap-1 rounded-full"
            disabled={busy || !canGenerate}
            title={
              canGenerate
                ? undefined
                : 'Belum ada observasi harian minggu ini untuk dijadikan bahan AI.'
            }
            onClick={actions.onGenerate}
          >
            <Sparkles />
            Buat dengan AI
          </Button>
          <Button
            className="gap-1 rounded-full px-5"
            disabled={busy || !text}
            onClick={actions.onSaveManual}
          >
            <Check />
            Kirim ke orang tua
          </Button>
        </div>
      )

    default: {
      const unhandled: never = state
      return unhandled
    }
  }
}
