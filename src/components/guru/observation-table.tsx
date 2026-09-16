import { useEffect, useMemo, useRef, useState } from 'react'
import { SearchInput } from '#/components/common/search-input'
import { SortableTableHeader } from '#/components/common/sortable-table-header'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { ObservationPagination } from './observation-pagination'
import { useSortableData } from '#/hooks/use-sortable-data'
import { indicatorLabels } from '#/lib/domain'
import type {
  Frequency,
  Indicator,
  ObservationRow,
  Student,
} from '#/server/tenant-data'
import { ObservationPillSelect } from './observation-pill-select'
import { GuruTableContainer } from './guru-table-container'

const INDICATORS: Array<Indicator> = [
  'respons',
  'interaksi',
  'partisipasi',
  'regulasi',
]
const PAGE_SIZE = 10
const collator = new Intl.Collator('id-ID', {
  numeric: true,
  sensitivity: 'base',
})

type SortKey = 'name' | 'nisn'

type Props = {
  students: Array<Student>
  rows: Array<ObservationRow>
  onRowsChange: (rows: Array<ObservationRow>) => void
}

function getStudent(id: string, students: Array<Student>): Student | undefined {
  return students.find((s) => s.id === id)
}

export function ObservationTable({ students, rows, onRowsChange }: Props) {
  const tableRef = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const filteredRows = useMemo(() => {
    const search = query.trim().toLocaleLowerCase('id-ID')
    return rows.filter((row) => {
      const student = getStudent(row.studentId, students)
      return (
        student &&
        (!search ||
          `${student.name} ${student.nisn}`
            .toLocaleLowerCase('id-ID')
            .includes(search))
      )
    })
  }, [query, rows, students])
  const sorters = useMemo(
    () => ({
      name: (left: ObservationRow, right: ObservationRow) =>
        collator.compare(
          getStudent(left.studentId, students)?.name ?? '',
          getStudent(right.studentId, students)?.name ?? '',
        ),
      nisn: (left: ObservationRow, right: ObservationRow) =>
        collator.compare(
          getStudent(left.studentId, students)?.nisn ?? '',
          getStudent(right.studentId, students)?.nisn ?? '',
        ),
    }),
    [students],
  )
  const { getDirection, sortedItems, toggleSort } = useSortableData<
    ObservationRow,
    SortKey
  >(filteredRows, sorters)
  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE))
  const visibleRows = sortedItems.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  )

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
      <label className="flex w-full flex-col gap-2 text-sm font-medium sm:max-w-sm">
        Cari siswa
        <SearchInput
          placeholder="Nama atau NISN"
          value={query}
          containerClassName="sm:max-w-none"
          onValueChange={(nextQuery) => {
            setQuery(nextQuery)
            setPage(1)
          }}
        />
      </label>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 lg:hidden">
        <span className="text-sm text-muted-foreground">Urutkan:</span>
        <SortableTableHeader
          label="Nama"
          className="mx-0 h-11"
          direction={getDirection('name')}
          onClick={() => {
            toggleSort('name')
            setPage(1)
          }}
        />
        <SortableTableHeader
          label="NISN"
          className="mx-0 h-11"
          direction={getDirection('nisn')}
          onClick={() => {
            toggleSort('nisn')
            setPage(1)
          }}
        />
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {sortedItems.length
          ? `${sortedItems.length} siswa`
          : query.trim()
            ? 'Tidak ada siswa yang cocok dengan pencarian.'
            : 'Belum ada siswa di kelas ini.'}
      </p>
      <ul className="grid min-w-0 gap-3 lg:hidden" aria-label="Observasi siswa">
        {visibleRows.map((row) => {
          const student = getStudent(row.studentId, students)
          if (!student) return null
          return (
            <li
              key={row.studentId}
              className="min-w-0 rounded-xl bg-card p-4 ring-1 ring-foreground/5"
            >
              <h2 className="text-base font-semibold wrap-anywhere">
                {student.name}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground wrap-anywhere">
                NISN {student.nisn}
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {INDICATORS.map((indicator) => (
                  <div key={indicator} className="flex min-w-0 flex-col gap-2">
                    <span className="text-sm">
                      {indicatorLabels[indicator]}
                    </span>
                    <ObservationPillSelect
                      label={`${student.name}: ${indicatorLabels[indicator]}`}
                      className="min-h-11 w-full min-w-0 text-sm"
                      value={row.values[indicator]}
                      onChange={(value) =>
                        updateCell(row.studentId, indicator, value)
                      }
                    />
                  </div>
                ))}
              </div>
            </li>
          )
        })}
      </ul>
      <GuruTableContainer className="hidden lg:block">
        <Table>
          <TableHeader>
            <TableRow className="border-0 hover:bg-transparent">
              <TableHead className="w-12 text-center text-card-foreground">
                No.
              </TableHead>
              <TableHead className="text-card-foreground">
                <SortableTableHeader
                  label="Nama Siswa"
                  direction={getDirection('name')}
                  onClick={() => {
                    toggleSort('name')
                    setPage(1)
                  }}
                />
              </TableHead>
              <TableHead className="text-card-foreground">
                <SortableTableHeader
                  label="NISN"
                  direction={getDirection('nisn')}
                  onClick={() => {
                    toggleSort('nisn')
                    setPage(1)
                  }}
                />
              </TableHead>
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
                        label={`${student.name}: ${indicatorLabels[ind]}`}
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
      </GuruTableContainer>

      <ObservationPagination
        page={page}
        totalPages={totalPages}
        onPageChange={changePage}
      />
    </div>
  )
}
