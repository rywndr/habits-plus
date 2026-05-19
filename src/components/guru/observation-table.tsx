import { useEffect, useState } from 'react'
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
import { indicatorLabels } from '#/lib/domain'
import type {
  Frequency,
  Indicator,
  ObservationRow,
  Student,
} from '#/server/tenant-data'
import { ObservationPillSelect } from './observation-pill-select'

const INDICATORS: Array<Indicator> = [
  'respons',
  'interaksi',
  'partisipasi',
  'regulasi',
]
const PAGE_SIZE = 10

type Props = {
  students: Array<Student>
  rows: Array<ObservationRow>
  onRowsChange: (rows: Array<ObservationRow>) => void
}

function getStudent(id: string, students: Array<Student>): Student | undefined {
  return students.find((s) => s.id === id)
}

export function ObservationTable({ students, rows, onRowsChange }: Props) {
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const visibleRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  function updateCell(
    studentId: string,
    indicator: Indicator,
    value: Frequency,
  ) {
    onRowsChange(
      rows.map((r) =>
        r.studentId === studentId
          ? { ...r, values: { ...r.values, [indicator]: value } }
          : r,
      ),
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/5">
        <Table>
          <TableHeader>
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="w-12 text-center text-card-foreground">
                No.
              </TableHead>
              <TableHead className="text-card-foreground">Nama Siswa</TableHead>
              <TableHead className="text-card-foreground">NISN</TableHead>
              {INDICATORS.map((ind) => (
                <TableHead
                  key={ind}
                  className="bg-brand-table-header text-center text-brand-navy-foreground"
                >
                  <span className="block text-xs leading-tight">
                    {indicatorLabels[ind]}
                  </span>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row, idx) => {
              const student = getStudent(row.studentId, students)
              if (!student) return null
              return (
                <TableRow key={row.studentId}>
                  <TableCell className="text-center text-muted-foreground">
                    {(page - 1) * PAGE_SIZE + idx + 1}
                  </TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {student.nisn}
                  </TableCell>
                  {INDICATORS.map((ind) => (
                    <TableCell key={ind} className="text-center">
                      <ObservationPillSelect
                        value={row.values[ind]}
                        onChange={(v) => updateCell(row.studentId, ind, v)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
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
