import { Pencil, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { SortableTableHeader } from '#/components/common/sortable-table-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { Button } from '#/components/ui/button'
import { ObservationPagination } from './observation-pagination'
import { useSortableData } from '#/hooks/use-sortable-data'
import type { WeeklyNote } from '#/server/tenant-data'
import {
  WEEKLY_NOTE_QUESTIONS,
  WeeklyNoteDeleteDialog,
  WeeklyNoteEditDialog,
} from './weekly-note-dialogs'
import { GuruTableContainer } from './guru-table-container'

type Props = {
  weeklyNotes: Array<WeeklyNote>
  showClassColumn?: boolean
  onDelete: (note: WeeklyNote) => Promise<void>
  onEdit: (
    note: WeeklyNote,
    values: Pick<WeeklyNote, 'p1' | 'p2' | 'p3'>,
  ) => Promise<void>
}

const PAGE_SIZE = 10
const dateSorters = {
  date: (left: WeeklyNote, right: WeeklyNote) =>
    left.date.localeCompare(right.date),
}

export function WeeklyNotesTable({
  weeklyNotes,
  showClassColumn = false,
  onDelete,
  onEdit,
}: Props) {
  const tableRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(1)
  const [editingNote, setEditingNote] = useState<WeeklyNote | null>(null)
  const [deletingNote, setDeletingNote] = useState<WeeklyNote | null>(null)
  const { getDirection, sortedItems, toggleSort } = useSortableData(
    weeklyNotes,
    dateSorters,
  )
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE))
  const visibleNotes = sortedItems.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  function changePage(nextPage: number) {
    setPage(nextPage)
    tableRef.current?.scrollIntoView({ block: 'start' })
    tableRef.current?.focus({ preventScroll: true })
  }

  return (
    <div
      ref={tableRef}
      tabIndex={-1}
      className="flex min-w-0 scroll-mt-16 flex-col gap-3 outline-none"
    >
      <div className="flex items-center justify-between gap-3 lg:hidden">
        <span className="text-sm text-muted-foreground">
          {weeklyNotes.length} catatan
        </span>
        <SortableTableHeader
          label="Tanggal"
          className="mx-0 h-11"
          direction={getDirection('date')}
          onClick={() => {
            toggleSort('date')
            setPage(1)
          }}
        />
      </div>
      {!weeklyNotes.length && (
        <p
          role="status"
          className="rounded-xl bg-card p-4 text-sm text-muted-foreground ring-1 ring-foreground/5"
        >
          Belum ada observasi mingguan untuk pilihan ini.
        </p>
      )}
      <ul
        className="grid min-w-0 gap-3 lg:hidden"
        aria-label="Catatan observasi mingguan"
      >
        {visibleNotes.map((note) => (
          <li
            key={note.id}
            className="min-w-0 rounded-xl bg-card p-4 ring-1 ring-foreground/5"
          >
            <h2 className="text-base font-semibold wrap-anywhere">
              {note.dateLabel}
            </h2>
            {showClassColumn && (
              <p className="mt-1 text-sm text-muted-foreground wrap-anywhere">
                Kelas {note.className ?? '-'}
              </p>
            )}
            <dl className="mt-4 grid gap-4">
              {WEEKLY_NOTE_QUESTIONS.map(({ field, label }) => (
                <div key={field} className="min-w-0">
                  <dt className="text-sm font-medium">{label}</dt>
                  <dd className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground wrap-anywhere">
                    {note[field] || 'Belum diisi.'}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2 border-t pt-3">
              <Button
                variant="outline"
                className="h-11 flex-1"
                aria-label={`Sunting catatan ${note.dateLabel}${showClassColumn ? ` kelas ${note.className ?? '-'}` : ''}`}
                onClick={() => setEditingNote(note)}
              >
                <Pencil aria-hidden="true" /> Sunting
              </Button>
              <Button
                variant="ghost"
                className="h-11 text-destructive"
                aria-label={`Hapus catatan ${note.dateLabel}${showClassColumn ? ` kelas ${note.className ?? '-'}` : ''}`}
                onClick={() => setDeletingNote(note)}
              >
                <Trash2 aria-hidden="true" /> Hapus
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <GuruTableContainer className="hidden lg:block">
        <Table className="min-w-[720px] table-fixed">
          <colgroup>
            <col className="w-12" />
            <col className="w-40" />
            {showClassColumn ? <col className="w-20" /> : null}
            <col />
            <col />
            <col />
            <col className="w-24" />
          </colgroup>
          <TableHeader>
            <TableRow className="border-0 bg-brand-table-header hover:bg-brand-table-header">
              <TableHead className="text-center text-brand-navy-foreground">
                No.
              </TableHead>
              <TableHead className="text-brand-navy-foreground">
                <SortableTableHeader
                  label="Tanggal"
                  direction={getDirection('date')}
                  onClick={() => {
                    toggleSort('date')
                    setPage(1)
                  }}
                />
              </TableHead>
              {showClassColumn ? (
                <TableHead className="text-brand-navy-foreground">
                  Kelas
                </TableHead>
              ) : null}
              <TableHead className="text-brand-navy-foreground">P1</TableHead>
              <TableHead className="text-brand-navy-foreground">P2</TableHead>
              <TableHead className="text-brand-navy-foreground">P3</TableHead>
              <TableHead className="text-center text-brand-navy-foreground">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleNotes.map((note, idx) => (
              <TableRow key={note.id} className="align-top">
                <TableCell className="py-3 text-center text-muted-foreground">
                  {(page - 1) * PAGE_SIZE + idx + 1}
                </TableCell>
                <TableCell className="py-3 text-sm whitespace-nowrap">
                  {note.dateLabel}
                </TableCell>
                {showClassColumn ? (
                  <TableCell className="py-3 text-sm whitespace-nowrap">
                    {note.className ?? '-'}
                  </TableCell>
                ) : null}
                <TableCell className="py-3 text-sm leading-snug whitespace-normal text-muted-foreground">
                  <p className="line-clamp-3 wrap-anywhere">{note.p1}</p>
                </TableCell>
                <TableCell className="py-3 text-sm leading-snug whitespace-normal text-muted-foreground">
                  <p className="line-clamp-3 wrap-anywhere">{note.p2}</p>
                </TableCell>
                <TableCell className="py-3 text-sm leading-snug whitespace-normal text-muted-foreground">
                  <p className="line-clamp-3 wrap-anywhere">{note.p3}</p>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex justify-center gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Sunting"
                      className="text-brand-orange"
                      onClick={() => setEditingNote(note)}
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Hapus"
                      className="text-muted-foreground"
                      onClick={() => setDeletingNote(note)}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </GuruTableContainer>

      <ObservationPagination
        page={page}
        totalPages={totalPages}
        onPageChange={changePage}
      />

      <WeeklyNoteEditDialog
        note={editingNote}
        open={editingNote !== null}
        onOpenChange={(open) => {
          if (!open) setEditingNote(null)
        }}
        onSave={onEdit}
      />
      <WeeklyNoteDeleteDialog
        note={deletingNote}
        open={deletingNote !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingNote(null)
        }}
        onDelete={onDelete}
      />
    </div>
  )
}
