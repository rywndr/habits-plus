import { useMemo, useState } from 'react'
import { createFileRoute, useRouter } from '@tanstack/react-router'
import { Download, FileSpreadsheet, Upload } from 'lucide-react'
import * as XLSX from 'xlsx'
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
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { bulkImportAdminRows } from '#/server/actions'

export const Route = createFileRoute('/admin/impor-data')({
  component: ImporData,
  staticData: { title: 'Impor Data' },
})

type ImportKind = 'teachers' | 'students' | 'parents'

type Template = {
  kind: ImportKind
  title: string
  description: string
  filename: string
  columns: Array<string>
  headers: Array<string>
  examples: Array<Array<string>>
}

const templates: Array<Template> = [
  {
    kind: 'teachers',
    title: 'Guru',
    description:
      'Tambah atau perbarui akun guru. Isi kelas dengan nama kelas, pisahkan beberapa kelas dengan tanda |.',
    filename: 'template-guru.xlsx',
    columns: ['name', 'email', 'password', 'class_names'],
    headers: ['Nama Guru', 'Email', 'Kata Sandi Awal', 'Nama Kelas'],
    examples: [
      ['Budi Santoso', 'budi@sekolah.id', 'password123', 'VII A|VII B'],
      ['Ratna Wijaya', 'ratna@sekolah.id', 'password123', 'VIII A'],
      ['Agus Pratama', 'agus@sekolah.id', 'password123', 'VII A|VIII A'],
    ],
  },
  {
    kind: 'students',
    title: 'Siswa',
    description:
      'Tambah atau perbarui siswa. Nama kelas harus sudah ada di menu Kelola Kelas.',
    filename: 'template-siswa.xlsx',
    columns: ['nisn', 'name', 'class_name', 'gender'],
    headers: ['NISN', 'Nama Siswa', 'Nama Kelas', 'Jenis Kelamin (L/P)'],
    examples: [
      ['20260001', 'Alya Putri', 'VII A', 'P'],
      ['20260002', 'Rafi Hidayat', 'VII A', 'L'],
      ['20260003', 'Nadia Safitri', 'VIII A', 'P'],
    ],
  },
  {
    kind: 'parents',
    title: 'Orang Tua',
    description:
      'Tambah atau perbarui akun orang tua. Tautkan anak memakai NISN siswa.',
    filename: 'template-orang-tua.xlsx',
    columns: ['name', 'email', 'password', 'student_nisn'],
    headers: ['Nama Orang Tua', 'Email', 'Kata Sandi Awal', 'NISN Siswa'],
    examples: [
      ['Dewi Lestari', 'dewi@example.id', 'password123', '20260001'],
      ['Ahmad Hidayat', 'ahmad@example.id', 'password123', '20260002'],
      ['Maya Safitri', 'maya@example.id', 'password123', '20260003'],
    ],
  },
]

function downloadTemplate(template: Template) {
  const workbook = XLSX.utils.book_new()
  const dataRows = [
    template.headers,
    ...Array.from({ length: 25 }, () => template.columns.map(() => '')),
  ]
  const dataSheet = XLSX.utils.aoa_to_sheet(dataRows)
  const exampleSheet = XLSX.utils.aoa_to_sheet([
    template.headers,
    ...template.examples,
    [],
    ['Catatan'],
    [
      template.kind === 'teachers'
        ? 'Kolom Nama Kelas boleh berisi beberapa kelas, pisahkan dengan tanda |. Nama kelas harus sama dengan data di Kelola Kelas.'
        : template.kind === 'students'
          ? 'Jenis kelamin hanya L atau P. Nama kelas harus sama dengan data di Kelola Kelas.'
          : 'NISN Siswa harus sama dengan data siswa yang sudah ada atau diimpor sebelumnya.',
    ],
  ])

  dataSheet['!cols'] = template.headers.map(() => ({ wch: 24 }))
  exampleSheet['!cols'] = template.headers.map(() => ({ wch: 24 }))
  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Data')
  XLSX.utils.book_append_sheet(workbook, exampleSheet, 'Contoh')
  XLSX.writeFile(workbook, template.filename)
}

function parseWorkbookRows(
  workbook: XLSX.WorkBook,
  template: Template,
): Array<Record<string, string>> {
  const sheetName = workbook.SheetNames.includes('Data')
    ? 'Data'
    : workbook.SheetNames[0]
  const sheet = workbook.Sheets[sheetName]
  const matrix = XLSX.utils.sheet_to_json<Array<string>>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  })

  return matrix
    .slice(1)
    .map((row) =>
      Object.fromEntries(
        template.columns.map((column, index) => [
          column,
          String(row[index] ?? '').trim(),
        ]),
      ),
    )
    .filter((row) => Object.values(row).some((value) => value.trim()))
}

function ImporData() {
  const router = useRouter()
  const [selectedKind, setSelectedKind] = useState<ImportKind>('teachers')
  const [rows, setRows] = useState<Array<Record<string, string>>>([])
  const [fileName, setFileName] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<{
    imported: number
    errors: Array<string>
  } | null>(null)
  const selectedTemplate = templates.find((item) => item.kind === selectedKind)!
  const visibleRows = useMemo(() => rows.slice(0, 5), [rows])

  async function handleFileChange(file: File | undefined) {
    setResult(null)
    setFileName(file?.name ?? '')

    if (!file) {
      setRows([])
      return
    }

    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    setRows(parseWorkbookRows(workbook, selectedTemplate))
  }

  async function handleImport() {
    setIsImporting(true)
    try {
      const nextResult = await bulkImportAdminRows({
        data: { kind: selectedKind, rows },
      })
      setResult(nextResult)
      await router.invalidate()
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader title="Impor Data" />

        <div className="grid gap-4 lg:grid-cols-3">
          {templates.map((template) => (
            <Card key={template.kind} className="rounded-lg">
              <CardHeader>
                <CardTitle>{template.title}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button
                  type="button"
                  variant={
                    selectedKind === template.kind ? 'default' : 'outline'
                  }
                  className="gap-2"
                  onClick={() => {
                    setSelectedKind(template.kind)
                    setRows([])
                    setFileName('')
                    setResult(null)
                  }}
                >
                  <FileSpreadsheet />
                  Pilih
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="gap-2"
                  onClick={() => downloadTemplate(template)}
                >
                  <Download />
                  Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Upload {selectedTemplate.title}</CardTitle>
            <CardDescription>
              Unggah file Excel sesuai template. Data valid akan ditambahkan atau
              diperbarui berdasarkan email/NISN.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="bulk-file">File Excel</Label>
              <Input
                id="bulk-file"
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={(event) =>
                  void handleFileChange(event.currentTarget.files?.[0])
                }
              />
              {fileName ? (
                <p className="text-xs text-muted-foreground">{fileName}</p>
              ) : null}
            </div>

            {rows.length ? (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full min-w-[680px] text-sm">
                  <thead className="bg-brand-table-header text-brand-navy-foreground">
                    <tr>
                      {selectedTemplate.columns.map((column) => (
                        <th key={column} className="px-3 py-2 text-left">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row, index) => (
                      <tr key={index} className="border-t border-border">
                        {selectedTemplate.columns.map((column) => (
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
                <p>{result.imported} baris berhasil diimpor.</p>
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
              onClick={() => void handleImport()}
            >
              <Upload />
              {isImporting ? 'Mengimpor...' : `Impor ${rows.length} baris`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </ContentPanel>
  )
}
