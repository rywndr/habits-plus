export type Frequency = 'tidak-terlihat' | 'terlihat-sesekali' | 'sering'

export const frequencyLabels: Record<Frequency, string> = {
  'tidak-terlihat': 'Tidak Terlihat',
  'terlihat-sesekali': 'Terlihat Sesekali',
  sering: 'Sering',
}

export type Indicator = 'respons' | 'interaksi' | 'partisipasi' | 'regulasi'

export const indicatorLabels: Record<Indicator, string> = {
  respons: 'Respons terhadap instruksi',
  interaksi: 'Interaksi dengan teman',
  partisipasi: 'Partisipasi kegiatan',
  regulasi: 'Regulasi emosi',
}

export type ObservationRow = {
  studentId: string
  values: Record<Indicator, Frequency>
}

/** Initial mock per-student frequency picks for the table */
export const dailyObservations: Array<ObservationRow> = [
  { studentId: 's-1', values: { respons: 'tidak-terlihat', interaksi: 'sering', partisipasi: 'terlihat-sesekali', regulasi: 'sering' } },
  { studentId: 's-2', values: { respons: 'sering', interaksi: 'sering', partisipasi: 'terlihat-sesekali', regulasi: 'terlihat-sesekali' } },
  { studentId: 's-3', values: { respons: 'sering', interaksi: 'sering', partisipasi: 'sering', regulasi: 'sering' } },
  { studentId: 's-4', values: { respons: 'terlihat-sesekali', interaksi: 'sering', partisipasi: 'sering', regulasi: 'sering' } },
  { studentId: 's-5', values: { respons: 'terlihat-sesekali', interaksi: 'tidak-terlihat', partisipasi: 'sering', regulasi: 'sering' } },
  { studentId: 's-6', values: { respons: 'sering', interaksi: 'sering', partisipasi: 'terlihat-sesekali', regulasi: 'terlihat-sesekali' } },
  { studentId: 's-7', values: { respons: 'tidak-terlihat', interaksi: 'sering', partisipasi: 'sering', regulasi: 'sering' } },
  { studentId: 's-8', values: { respons: 'tidak-terlihat', interaksi: 'sering', partisipasi: 'sering', regulasi: 'tidak-terlihat' } },
  { studentId: 's-9', values: { respons: 'terlihat-sesekali', interaksi: 'sering', partisipasi: 'tidak-terlihat', regulasi: 'sering' } },
  { studentId: 's-10', values: { respons: 'tidak-terlihat', interaksi: 'tidak-terlihat', partisipasi: 'sering', regulasi: 'terlihat-sesekali' } },
]
