import type { ReactNode } from 'react'
import { useState } from 'react'
import { Pencil, Search, Trash2 } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '#/components/ui/pagination'

export type Column<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
}

type Props<T> = {
  rows: Array<T>
  columns: Array<Column<T>>
  filterKey?: keyof T
  toolbar?: ReactNode
  onEdit?: (row: T) => void
  onDelete?: (row: T) => void
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  filterKey,
  toolbar,
  onEdit,
  onDelete,
}: Props<T>) {
  const [q, setQ] = useState('')
  const filtered = filterKey
    ? rows.filter((r) =>
        String(r[filterKey]).toLowerCase().includes(q.toLowerCase()),
      )
    : rows

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari..."
            className="rounded-full bg-card pl-9"
          />
        </div>
        {toolbar}
      </div>

      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/5">
        <Table>
          <TableHeader>
            <TableRow className="border-0 bg-brand-table-header hover:bg-brand-table-header">
              {columns.map((c) => (
                <TableHead
                  key={c.key}
                  className={`text-brand-navy-foreground ${c.className ?? ''}`}
                >
                  {c.header}
                </TableHead>
              ))}
              {(onEdit ?? onDelete) ? (
                <TableHead className="w-24 text-center text-brand-navy-foreground">
                  Aksi
                </TableHead>
              ) : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 1}
                  className="py-8 text-center text-muted-foreground"
                >
                  Tidak ada data.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => (
                <TableRow key={row.id}>
                  {columns.map((c) => (
                    <TableCell key={c.key} className={c.className}>
                      {c.render(row)}
                    </TableCell>
                  ))}
                  {(onEdit ?? onDelete) ? (
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        {onEdit ? (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="text-brand-orange"
                            onClick={() => onEdit(row)}
                          >
                            <Pencil />
                          </Button>
                        ) : null}
                        {onDelete ? (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="text-muted-foreground"
                            onClick={() => onDelete(row)}
                          >
                            <Trash2 />
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination className="justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#" />
          </PaginationItem>
          {[1, 2, 3].map((n) => (
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
