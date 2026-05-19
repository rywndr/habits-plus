import type { Frequency, Indicator } from './observations'
import { frequencyLabels, indicatorLabels } from './observations'

export type KpiStat = {
  indicator: Indicator
  label: string
  frequency: Frequency
  frequencyLabel: string
}

const indicatorOnBeranda: Record<Indicator, string> = {
  respons: 'Inisiasi Interaksi Sosial',
  interaksi: 'Respon Terhadap Interaksi',
  partisipasi: 'Partisipasi dalam Kelompok',
  regulasi: 'Regulasi Perilaku Sosial',
}

const beranda: Array<{ indicator: Indicator; frequency: Frequency }> = [
  { indicator: 'respons', frequency: 'tidak-terlihat' },
  { indicator: 'interaksi', frequency: 'terlihat-sesekali' },
  { indicator: 'partisipasi', frequency: 'sering' },
  { indicator: 'regulasi', frequency: 'tidak-terlihat' },
]

export const kpiStats: Array<KpiStat> = beranda.map((b) => ({
  indicator: b.indicator,
  label: indicatorOnBeranda[b.indicator],
  frequency: b.frequency,
  frequencyLabel: frequencyLabels[b.frequency],
}))

export const genderDistribution = {
  laki: 62,
  perempuan: 38,
}

export const parentSummaryText =
  'Dalam periode ini, rutinitas kelas berjalan relatif stabil.'

export const parentIndicators: Array<{
  indicator: Indicator
  label: string
  trend: 'meningkat' | 'stabil'
  graphic: string
}> = [
  { indicator: 'respons', label: 'Inisiasi Interaksi Sosial', trend: 'meningkat', graphic: '/graphics/graphic-1.png' },
  { indicator: 'interaksi', label: 'Respon Terhadap Interaksi', trend: 'meningkat', graphic: '/graphics/graphic-2.png' },
  { indicator: 'partisipasi', label: 'Partisipasi Kegiatan', trend: 'stabil', graphic: '/graphics/graphic-3.png' },
  { indicator: 'regulasi', label: 'Regulasi Emosi', trend: 'meningkat', graphic: '/graphics/graphic-4.png' },
]

export { indicatorLabels }
