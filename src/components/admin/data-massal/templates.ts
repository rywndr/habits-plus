export type ImportKind = 'teachers' | 'students' | 'parents'
export type ImportMode = 'create' | 'update'

export type Template = {
  kind: ImportKind
  title: string
  description: string
  filename: string
  columns: Array<string>
  headers: Array<string>
  examples: Array<Array<string>>
}

export const ALL_CLASSES = 'all'

export const templates: Array<Template> = [
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

function activeColumnIndexes(template: Template, mode: ImportMode) {
  return template.columns
    .map((column, index) => ({ column, index }))
    .filter(({ column }) => mode !== 'update' || column !== 'password')
}

export function activeColumns(template: Template, mode: ImportMode) {
  return activeColumnIndexes(template, mode).map(({ column }) => column)
}

export function activeHeaders(template: Template, mode: ImportMode) {
  return activeColumnIndexes(template, mode).map(
    ({ index }) => template.headers[index],
  )
}

export function activeExamples(template: Template, mode: ImportMode) {
  const indexes = activeColumnIndexes(template, mode).map(({ index }) => index)
  return template.examples.map((example) => indexes.map((i) => example[i]))
}

export function templateNote(template: Template, mode: ImportMode) {
  if (mode === 'update') {
    if (template.kind === 'teachers') {
      return 'Email digunakan sebagai identitas — jangan diubah. Kosongkan kolom Nama Kelas untuk melepas penugasan kelas.'
    }
    if (template.kind === 'students') {
      return 'NISN digunakan sebagai identitas — jangan diubah. Jenis kelamin hanya L atau P; nama kelas harus sama dengan data di Kelola Kelas.'
    }
    return 'Email digunakan sebagai identitas — jangan diubah. NISN Siswa harus sama dengan data siswa yang sudah ada.'
  }
  if (template.kind === 'teachers') {
    return 'Kolom Nama Kelas boleh berisi beberapa kelas, pisahkan dengan tanda |. Nama kelas harus sama dengan data di Kelola Kelas.'
  }
  if (template.kind === 'students') {
    return 'Jenis kelamin hanya L atau P. Nama kelas harus sama dengan data di Kelola Kelas.'
  }
  return 'NISN Siswa harus sama dengan data siswa yang sudah ada atau diimpor sebelumnya.'
}
