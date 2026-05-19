import { Pencil, Trash2 } from 'lucide-react'
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
import type { WeeklyNote } from '#/server/tenant-data'

type Props = {
  weeklyNotes: Array<WeeklyNote>
}

export function WeeklyNotesTable({ weeklyNotes }: Props) {
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
                Tanggal
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
            {weeklyNotes.map((note, idx) => (
              <TableRow key={note.id} className="align-top">
                <TableCell className="py-3 text-center text-muted-foreground">
                  {idx + 1}
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

      <Pagination className="justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          {[1, 2, 3, 4, 5].map((n) => (
            <PaginationItem key={n}>
              <PaginationLink href="#" isActive={n === 1}>
                {n}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext href="#" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
