import { useState } from 'react'
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
import {
  
  
  
  
  dailyObservations,
  indicatorLabels,
  students as allStudents
} from '#/data'
import type {Frequency, Indicator, ObservationRow, Student} from '#/data';
import { ObservationPillSelect } from './observation-pill-select'

const INDICATORS: Array<Indicator> = [
  'respons',
  'interaksi',
  'partisipasi',
  'regulasi',
]

function getStudent(id: string): Student | undefined {
  return allStudents.find((s) => s.id === id)
}

export function ObservationTable() {
  const [rows, setRows] = useState<Array<ObservationRow>>(dailyObservations)

  function updateCell(studentId: string, indicator: Indicator, value: Frequency) {
    setRows((prev) =>
      prev.map((r) =>
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
              <TableHead className="w-12 text-center text-card-foreground">No.</TableHead>
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
            {rows.map((row, idx) => {
              const student = getStudent(row.studentId)
              if (!student) return null
              return (
                <TableRow key={row.studentId}>
                  <TableCell className="text-center text-muted-foreground">
                    {idx + 1}
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
