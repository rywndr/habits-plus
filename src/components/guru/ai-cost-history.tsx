import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { formatUsd } from '#/lib/format'
import type { AiGenerationHistoryEntry } from '#/server/tenant-data'

type Props = {
  history: Array<AiGenerationHistoryEntry>
}

export function AiCostHistory({ history }: Props) {
  const totalUsd = history.reduce((sum, entry) => sum + entry.costUsd, 0)
  const totalTokens = history.reduce(
    (sum, entry) => sum + entry.promptTokens + entry.completionTokens,
    0,
  )

  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-2xl bg-card px-4 py-3 text-sm ring-1 ring-foreground/5">
        Total biaya generate:{' '}
        <span className="font-heading font-semibold">
          {formatUsd(totalUsd)}
        </span>{' '}
        <span className="text-muted-foreground">
          ({history.length} batch, {totalTokens} token)
        </span>
      </p>
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
              <TableHead className="text-center text-brand-navy-foreground">
                Token (in/out)
              </TableHead>
              <TableHead className="text-right text-brand-navy-foreground">
                Biaya
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-6 text-center text-muted-foreground"
                >
                  Belum ada riwayat generate.
                </TableCell>
              </TableRow>
            ) : (
              history.map((entry) => (
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
                  <TableCell className="text-center text-sm">
                    {entry.promptTokens}/{entry.completionTokens}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {formatUsd(entry.costUsd)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
