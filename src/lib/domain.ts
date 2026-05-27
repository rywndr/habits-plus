import type { Frequency, Indicator, Role } from '#/db/schema'

export const roleLabels: Record<Role, string> = {
  'super-admin': 'super admin',
  admin: 'admin sekolah',
  guru: 'guru',
  ortu: 'orang tua',
}

export const indicatorLabels: Record<Indicator, string> = {
  respons: 'Respons terhadap instruksi',
  interaksi: 'Interaksi dengan teman',
  partisipasi: 'Partisipasi kegiatan',
  regulasi: 'Regulasi emosi',
}

export const frequencyLabels: Record<Frequency, string> = {
  'tidak-terlihat': 'Tidak Terlihat',
  'terlihat-sesekali': 'Terlihat Sesekali',
  sering: 'Sering',
}
