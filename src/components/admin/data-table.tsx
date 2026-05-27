import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Pencil, Search, Trash2 } from 'lucide-react'
import { SortableTableHeader } from '#/components/common/sortable-table-header'
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
import type { SortDirection } from '#/hooks/use-sortable-data'

export type Column<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  sortValue?: (row: T) => string | number | null | undefined
  sortable?: boolean
  className?: string
}

type SortState = {
  key: string
  direction: SortDirection
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
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<SortState>()
  const filtered = filterKey
    ? rows.filter((r) =>
        String(r[filterKey]).toLowerCase().includes(q.toLowerCase()),
      )
    : rows
  const sortedRows = sort
    ? filtered
        .map((row, index) => ({ row, index }))
        .sort((left, right) => {
          const column = columns.find((item) => item.key === sort.key)
          const leftValue = column?.sortValue
            ? column.sortValue(left.row)
            : String(left.row[sort.key as keyof T] ?? '')
          const rightValue = column?.sortValue
            ? column.sortValue(right.row)
            : String(right.row[sort.key as keyof T] ?? '')
          const result =
            typeof leftValue === 'number' && typeof rightValue === 'number'
              ? leftValue - rightValue
              : String(leftValue ?? '').localeCompare(
                  String(rightValue ?? ''),
                  'id',
                  { numeric: true, sensitivity: 'base' },
                )
          const stableResult = result || left.index - right.index

          return sort.direction === 'asc' ? stableResult : -stableResult
        })
        .map(({ row }) => row)
    : filtered
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const visibleRows = sortedRows.slice((page - 1) * pageSize, page * pageSize)
  const hasActions = Boolean(onEdit ?? onDelete)

  function toggleSort(key: string) {
    setSort((current) => ({
      key,
      direction:
        current?.key === key && current.direction === 'asc' ? 'desc' : 'asc',
    }))
    setPage(1)
  }

  useEffect(() => {
    setPage(1)
  }, [q, rows])

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

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
                  {c.sortable === false ? (
                    c.header
                  ) : (
                    <SortableTableHeader
                      label={c.header}
                      direction={
                        sort?.key === c.key ? sort.direction : undefined
                      }
                      onClick={() => toggleSort(c.key)}
                    />
                  )}
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
                  colSpan={columns.length + (hasActions ? 1 : 0)}
                  className="py-8 text-center text-muted-foreground"
                >
                  Tidak ada data.
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row) => (
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
