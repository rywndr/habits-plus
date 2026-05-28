import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from 'recharts'
import { indicatorLabels } from '#/lib/domain'
import type { Indicator } from '#/server/tenant-data'

type RadarPoint = {
  week: string
  values: Record<Indicator, number>
}

type Props = {
  data: Array<RadarPoint>
}

const ORDER: Array<Indicator> = [
  'respons',
  'interaksi',
  'partisipasi',
  'regulasi',
]

const seriesColor: Record<Indicator, string> = {
  respons: 'var(--color-chart-respons)',
  interaksi: 'var(--color-chart-interaksi)',
  partisipasi: 'var(--color-chart-partisipasi)',
  regulasi: 'var(--color-chart-regulasi)',
}

function toRows(data: Array<RadarPoint>) {
  return Array.from({ length: 4 }, (_, index) => {
    const point = data.at(index)
    return {
      axis: `Minggu ke-${index + 1}`,
      respons: point?.values.respons ?? 0,
      interaksi: point?.values.interaksi ?? 0,
      partisipasi: point?.values.partisipasi ?? 0,
      regulasi: point?.values.regulasi ?? 0,
    }
  })
}

export function SummaryRadarChart({ data }: Props) {
  const rows = toRows(data)

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <ul className="grid grid-cols-1 gap-1.5 self-start text-xs">
        {ORDER.map((indicator) => (
          <li key={indicator} className="flex items-center gap-2">
            <span
              className="inline-block size-3 rounded-full"
              style={{ backgroundColor: seriesColor[indicator] }}
            />
            <span className="text-muted-foreground">
              {indicatorLabels[indicator]}
            </span>
          </li>
        ))}
      </ul>

      <div
        className="w-full max-w-md"
        role="img"
        aria-label="Radar ringkasan observasi bulanan"
      >
        <ResponsiveContainer width="100%" aspect={1}>
          <RadarChart
            data={rows}
            outerRadius="72%"
            margin={{ top: 24, right: 72, bottom: 24, left: 72 }}
          >
            <PolarGrid
              gridType="polygon"
              strokeDasharray="3 3"
              className="stroke-border"
            />
            <PolarAngleAxis
              dataKey="axis"
              tick={{ fontSize: 11, fill: 'currentColor' }}
            />
            <PolarRadiusAxis
              angle={45}
              domain={[0, 2]}
              ticks={[0, 0.5, 1, 1.5, 2]}
              tickFormatter={(value) => value.toFixed(1)}
              tick={{ fontSize: 10, fill: 'currentColor' }}
              axisLine={false}
            />
            {ORDER.map((indicator) => (
              <Radar
                key={indicator}
                dataKey={indicator}
                stroke={seriesColor[indicator]}
                fill={seriesColor[indicator]}
                fillOpacity={0.18}
                strokeWidth={2}
                isAnimationActive={false}
              />
            ))}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
