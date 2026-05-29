import * as XLSX from 'xlsx'
import { frequencyLabels, indicatorLabels } from '#/lib/domain'
import type {
  DailyObservationExportRow,
  WeeklyNoteExportRow,
} from '#/server/loaders'

function writeWorkbook(
  sheetName: string,
  filename: string,
  headers: Array<string>,
  rows: Array<Array<string>>,
) {
  const workbook = XLSX.utils.book_new()
  const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  sheet['!cols'] = headers.map((header) => ({
    wch: Math.max(header.length + 4, 18),
  }))
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName)
  XLSX.writeFile(workbook, filename)
}

export function downloadDailyObservationWorkbook(
  rows: Array<DailyObservationExportRow>,
  options: { startDate: string; endDate: string },
) {
  writeWorkbook(
    'Observasi Harian',
    `observasi-harian-${options.startDate}-${options.endDate}.xlsx`,
    [
      'Tanggal',
      'Kelas',
      'NISN',
      'Siswa',
      indicatorLabels.respons,
      indicatorLabels.interaksi,
      indicatorLabels.partisipasi,
      indicatorLabels.regulasi,
      'Catatan',
    ],
    rows.map((row) => [
      row.observedAt,
      row.className,
      row.nisn,
      row.studentName,
      frequencyLabels[row.respons] ?? row.respons,
      frequencyLabels[row.interaksi] ?? row.interaksi,
      frequencyLabels[row.partisipasi] ?? row.partisipasi,
      frequencyLabels[row.regulasi] ?? row.regulasi,
      row.note,
    ]),
  )
}

export function downloadWeeklyNotesWorkbook(
  rows: Array<WeeklyNoteExportRow>,
  options: { startDate: string; endDate: string },
) {
  writeWorkbook(
    'Observasi Mingguan',
    `observasi-mingguan-${options.startDate}-${options.endDate}.xlsx`,
    [
      'Minggu Mulai',
      'Kelas',
      'Pendekatan yang digunakan',
      'Hal yang membantu',
      'Hal yang perlu disesuaikan',
    ],
    rows.map((row) => [
      row.weekStart,
      row.className ?? 'Semua kelas',
      row.p1,
      row.p2,
      row.p3,
    ]),
  )
}
