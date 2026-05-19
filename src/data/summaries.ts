import type { Indicator } from './observations'

export type Trend = 'meningkat' | 'stabil' | 'menurun' | 'tidak-terlihat'

export const trendLabels: Record<Trend, string> = {
  meningkat: 'MENINGKAT',
  stabil: 'STABIL',
  menurun: 'MENURUN',
  'tidak-terlihat': 'TIDAK TERLIHAT',
}

export type MonthlySummary = {
  /** YYYY-MM */
  month: string
  monthLabel: string
  text: string
  trends: Record<Indicator, Trend>
}

export const monthlySummaries: Array<MonthlySummary> = [
  {
    month: '2026-01',
    monthLabel: 'Januari 2026',
    text: 'Dalam 2 minggu terakhir, respons terhadap instruksi terlihat lebih konsisten.',
    trends: {
      respons: 'meningkat',
      interaksi: 'meningkat',
      partisipasi: 'meningkat',
      regulasi: 'stabil',
    },
  },
]

export function getLatestSummary(): MonthlySummary {
  return monthlySummaries[0]
}
