import { useEffect, useState } from 'react'
import { Cpu, Database, Layers, Users } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { TablePagination } from '#/components/common/table-pagination'
import type { LucideIcon } from 'lucide-react'
import type { AiGenerationHistoryEntry } from '#/server/tenant-data'

type Props = {
  history: Array<AiGenerationHistoryEntry>
}

const PAGE_SIZE = 10

const tokenFormatter = new Intl.NumberFormat('id-ID')

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon
  label: string
  value: string
  hint?: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-4 ring-1 ring-foreground/5">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-navy text-brand-navy-foreground">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-heading text-lg font-semibold">{value}</p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
    </div>
  )
}

export function AiUsageHistory({ history }: Props) {
  const [page, setPage] = useState(1)

  const inputTokens = history.reduce(
    (sum, entry) => sum + entry.promptTokens,
    0,
  )
  const cachedTokens = history.reduce(
    (sum, entry) => sum + entry.cachedTokens,
    0,
  )
  const outputTokens = history.reduce(
    (sum, entry) => sum + entry.completionTokens,
    0,
  )
  const totalStudents = history.reduce(
    (sum, entry) => sum + entry.studentCount,
    0,
  )

  const totalPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE))
  const visibleEntries = history.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages))
  }, [totalPages])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Cpu}
          label="Total token"
          value={tokenFormatter.format(inputTokens + outputTokens)}
        />
        <StatCard
          icon={Layers}
          label="Batch generate"
          value={tokenFormatter.format(history.length)}
        />
        <StatCard
          icon={Users}
          label="Ringkasan dibuat"
          value={tokenFormatter.format(totalStudents)}
        />
        <StatCard
          icon={Database}
          label="Token input"
          value={tokenFormatter.format(inputTokens)}
          hint={
            cachedTokens
              ? `${tokenFormatter.format(cachedTokens)} dari cache`
              : undefined
          }
        />
      </div>

      <div className="overflow-x-auto rounded-xl bg-card ring-1 ring-foreground/5">
        <Table>
          <TableHeader>
            <TableRow className="border-0 bg-brand-table-header hover:bg-brand-table-header">
              <TableHead className="text-brand-navy-foreground">
                Waktu
              </TableHead>
              <TableHead className="text-brand-navy-foreground">
                Kelas
              </TableHead>
              <TableHead className="text-brand-navy-foreground">
                Minggu
              </TableHead>
              <TableHead className="text-center text-brand-navy-foreground">
                Siswa
              </TableHead>
              <TableHead className="text-brand-navy-foreground">
                Model
              </TableHead>
              <TableHead className="text-center text-brand-navy-foreground">
                Token in
              </TableHead>
              <TableHead className="text-center text-brand-navy-foreground">
                Cache
              </TableHead>
              <TableHead className="text-center text-brand-navy-foreground">
                Token out
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleEntries.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="py-6 text-center text-muted-foreground"
                >
                  Belum ada riwayat generate.
                </TableCell>
              </TableRow>
            ) : (
              visibleEntries.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {entry.createdLabel}
                  </TableCell>
                  <TableCell className="text-sm">
                    {entry.className ?? '-'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {entry.weekStart}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {entry.studentCount}
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-xs">
                    {entry.model}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {tokenFormatter.format(entry.promptTokens)}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {tokenFormatter.format(entry.cachedTokens)}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {tokenFormatter.format(entry.completionTokens)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TablePagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
    </div>
  )
}
