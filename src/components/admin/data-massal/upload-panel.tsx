import { Upload } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import type { ImportMode, Template } from './templates'

type Props = {
  mode: ImportMode
  template: Template
  columns: Array<string>
  rows: Array<Record<string, string>>
  fileName: string
  skipped: number
  isImporting: boolean
  result: { imported: number; errors: Array<string> } | null
  onFileChange: (file: File | undefined) => void
  onImport: () => void
}

export function UploadPanel({
  mode,
  template,
  columns,
  rows,
  fileName,
  skipped,
  isImporting,
  result,
  onFileChange,
  onImport,
}: Props) {
  const previewRows = rows.slice(0, 5)

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Upload' : 'Unggah Pembaruan'} {template.title}
        </CardTitle>
        <CardDescription>
          {mode === 'create'
            ? 'Unggah file Excel sesuai template. Data valid akan ditambahkan atau diperbarui berdasarkan email/NISN.'
            : 'Unggah kembali template yang sudah diedit. Hanya baris dengan perubahan yang akan diproses.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid gap-2">
          <Label htmlFor="bulk-file">File Excel</Label>
          <Input
            id="bulk-file"
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(event) => onFileChange(event.currentTarget.files?.[0])}
          />
          {fileName ? (
            <p className="text-xs text-muted-foreground">
              {fileName}
              {mode === 'update' && skipped > 0
                ? ` — ${skipped} baris tanpa perubahan dilewati`
                : ''}
            </p>
          ) : null}
        </div>

        {rows.length ? (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="bg-brand-table-header text-brand-navy-foreground">
                <tr>
                  {columns.map((column) => (
                    <th key={column} className="px-3 py-2 text-left">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, index) => (
                  <tr key={index} className="border-t border-border">
                    {columns.map((column) => (
                      <td key={column} className="px-3 py-2">
                        {row[column] ?? '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {result ? (
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p>
              {result.imported} baris berhasil{' '}
              {mode === 'update' ? 'diperbarui' : 'diimpor'}.
            </p>
            {result.errors.length ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-destructive">
                {result.errors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <Button
          type="button"
          className="w-fit gap-2"
          disabled={!rows.length || isImporting}
          onClick={onImport}
        >
          <Upload />
          {isImporting
            ? mode === 'update'
              ? 'Memperbarui...'
              : 'Mengimpor...'
            : `${mode === 'update' ? 'Perbarui' : 'Impor'} ${rows.length} baris`}
        </Button>
      </CardContent>
    </Card>
  )
}
