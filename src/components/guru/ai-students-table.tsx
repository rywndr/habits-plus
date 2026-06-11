import { LoaderCircle } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import type { Gender } from '#/server/tenant-data'

export type AiStudentRow = {
  id: string
  name: string
  gender: Gender
  observedDays: number
  hasActiveSummary: boolean
}

type Props = {
  students: Array<AiStudentRow>
  selected: Set<string>
  allSelected: boolean
  hasEligible: boolean
  generatingIds: Set<string>
  draftIds: Set<string>
  notices: Record<string, string>
  onToggle: (id: string) => void
  onToggleAll: () => void
}

function StatusCell({
  student,
  generating,
  hasDraft,
  notice,
}: {
  student: AiStudentRow
  generating: boolean
  hasDraft: boolean
  notice: string | undefined
}) {
  if (student.hasActiveSummary) return <Badge>Tersimpan</Badge>
  if (generating) {
    return (
      <Badge variant="secondary">
        <LoaderCircle className="size-3 animate-spin" />
        Membuat...
      </Badge>
    )
  }
  if (hasDraft) return <Badge variant="secondary">Menunggu tinjauan</Badge>
  if (student.observedDays === 0) {
    return (
      <span className="text-xs text-muted-foreground">Tidak ada data</span>
    )
  }
  if (notice) {
    return (
      <span className="text-xs text-destructive" title={notice}>
        Gagal
      </span>
    )
  }
  return <span className="text-xs text-muted-foreground">-</span>
}

export function AiStudentsTable({
  students,
  selected,
  allSelected,
  hasEligible,
  generatingIds,
  draftIds,
  notices,
  onToggle,
  onToggleAll,
}: Props) {
  return (
    <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/5">
      <Table>
        <TableHeader>
          <TableRow className="border-0 bg-brand-table-header hover:bg-brand-table-header">
            <TableHead className="w-12 text-center">
              <input
                type="checkbox"
                aria-label="Pilih semua siswa"
                className="size-4 accent-brand-orange"
                checked={allSelected}
                onChange={onToggleAll}
                disabled={!hasEligible}
              />
            </TableHead>
            <TableHead className="w-12 text-center text-brand-navy-foreground">
              No.
            </TableHead>
            <TableHead className="text-brand-navy-foreground">Nama</TableHead>
            <TableHead className="w-16 text-center text-brand-navy-foreground">
              JK
            </TableHead>
            <TableHead className="w-36 text-center text-brand-navy-foreground">
              Hari terobservasi
            </TableHead>
            <TableHead className="w-44 text-center text-brand-navy-foreground">
              Status
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student, index) => {
            const locked =
              student.hasActiveSummary || student.observedDays === 0
            return (
              <TableRow key={student.id}>
                <TableCell className="text-center">
                  <input
                    type="checkbox"
                    aria-label={`Pilih ${student.name}`}
                    className="size-4 accent-brand-orange"
                    checked={selected.has(student.id)}
                    onChange={() => onToggle(student.id)}
                    disabled={locked}
                  />
                </TableCell>
                <TableCell className="text-center text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell className="text-center">{student.gender}</TableCell>
                <TableCell className="text-center">
                  {student.observedDays} hari
                </TableCell>
                <TableCell className="text-center">
                  <StatusCell
                    student={student}
                    generating={generatingIds.has(student.id)}
                    hasDraft={draftIds.has(student.id)}
                    notice={notices[student.id]}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
