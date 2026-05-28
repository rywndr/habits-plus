import * as XLSX from 'xlsx'
import {
  activeColumns,
  activeExamples,
  activeHeaders,
  templateNote,
} from './templates'
import type { ImportMode, Template } from './templates'

function buildTemplateWorkbook(
  template: Template,
  mode: ImportMode,
  populatedRows: Array<Array<string>>,
) {
  const workbook = XLSX.utils.book_new()
  const columns = activeColumns(template, mode)
  const headers = activeHeaders(template, mode)
  const examples = activeExamples(template, mode)
  const note = templateNote(template, mode)
  const blankRowCount = Math.max(25 - populatedRows.length, 5)
  const blankRows = Array.from({ length: blankRowCount }, () =>
    columns.map(() => ''),
  )

  const dataSheet = XLSX.utils.aoa_to_sheet([
    headers,
    ...populatedRows,
    ...blankRows,
  ])
  const exampleSheet = XLSX.utils.aoa_to_sheet([
    headers,
    ...examples,
    [],
    ['Catatan'],
    [note],
  ])

  dataSheet['!cols'] = headers.map(() => ({ wch: 24 }))
  exampleSheet['!cols'] = headers.map(() => ({ wch: 24 }))
  XLSX.utils.book_append_sheet(workbook, dataSheet, 'Data')
  XLSX.utils.book_append_sheet(workbook, exampleSheet, 'Contoh')
  return workbook
}

export function downloadBlankTemplate(template: Template) {
  const workbook = buildTemplateWorkbook(template, 'create', [])
  XLSX.writeFile(workbook, template.filename)
}

export function downloadFilledTemplate(
  template: Template,
  populatedRows: Array<Array<string>>,
) {
  const workbook = buildTemplateWorkbook(template, 'update', populatedRows)
  const filename = template.filename.replace(/\.xlsx$/, '-perbarui.xlsx')
  XLSX.writeFile(workbook, filename)
}

export async function parseUploadedRows(
  file: File,
  template: Template,
  mode: ImportMode,
): Promise<Array<Record<string, string>>> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const columns = activeColumns(template, mode)
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
        columns.map((column, index) => [
          column,
          String(row[index] ?? '').trim(),
        ]),
      ),
    )
    .filter((row) => Object.values(row).some((value) => value.trim()))
}
