import { Pencil, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '#/components/ui/pagination'
import { useSortableData } from '#/hooks/use-sortable-data'
import type { WeeklyNote } from '#/server/tenant-data'

type Props = {
  weeklyNotes: Array<WeeklyNote>
}

const PAGE_SIZE = 10
const dateSorters = {
  date: (left: WeeklyNote, right: WeeklyNote) =>
    left.date.localeCompare(right.date),
}

export function WeeklyNotesTable({ weeklyNotes }: Props) {
  const [page, setPage] = useState(1)
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

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/5">
        <Table className="table-fixed">
          <colgroup>
            <col className="w-12" />
            <col className="w-32" />
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
                <TableCell className="py-3 text-xs leading-snug text-muted-foreground sm:text-sm">
                  <p className="line-clamp-3 break-words">{note.p1}</p>
                </TableCell>
                <TableCell className="py-3 text-xs leading-snug text-muted-foreground sm:text-sm">
                  <p className="line-clamp-3 break-words">{note.p2}</p>
                </TableCell>
                <TableCell className="py-3 text-xs leading-snug text-muted-foreground sm:text-sm">
                  <p className="line-clamp-3 break-words">{note.p3}</p>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex justify-center gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Sunting"
                      className="text-brand-orange"
                    >
                      <Pencil />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      aria-label="Hapus"
                      className="text-muted-foreground"
                    >
                      <Trash2 />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 ? (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  setPage((current) => Math.max(1, current - 1))
                }}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(
              (n) => (
                <PaginationItem key={n}>
                  <PaginationLink
                    href="#"
                    isActive={n === page}
                    onClick={(event) => {
                      event.preventDefault()
                      setPage(n)
                    }}
                  >
                    {n}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(event) => {
                  event.preventDefault()
                  setPage((current) => Math.min(totalPages, current + 1))
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  )
}
