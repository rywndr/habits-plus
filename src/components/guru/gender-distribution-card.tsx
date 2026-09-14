import { Pie, PieChart, ResponsiveContainer } from 'recharts'
import { cn } from '#/lib/utils'

type Props = {
  laki: number
  perempuan: number
  className?: string
}

export function GenderDistributionCard({ laki, perempuan, className }: Props) {
  const data = [
    { name: 'Laki-laki', value: laki, fill: 'var(--color-brand-navy)' },
    { name: 'Perempuan', value: perempuan, fill: 'var(--color-brand-orange)' },
  ]
  const hasStudents = laki + perempuan > 0

  return (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-5 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/5 lg:justify-between lg:gap-2 lg:p-4',
        className,
      )}
    >
      <span className="text-center text-xs font-bold tracking-wide text-brand-navy uppercase">
        Kelompok Siswa
        <br />
        Berdasarkan Jenis Kelamin
      </span>
      {hasStudents ? (
        <div
          className="mx-auto h-44 w-full max-w-56 shrink-0 lg:h-36"
          role="img"
          aria-label={`Distribusi siswa: laki-laki ${laki}%, perempuan ${perempuan}%`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius="60%"
                outerRadius="95%"
                startAngle={90}
                endAngle={-270}
                stroke="var(--color-card)"
                strokeWidth={3}
                isAnimationActive={false}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="flex h-44 items-center justify-center text-sm text-muted-foreground lg:h-36">
          Belum ada siswa.
        </p>
      )}
      <ul
        aria-label="Legenda jenis kelamin"
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2"
      >
        {data.map((item) => (
          <li
            key={item.name}
            className="flex items-center gap-1.5 text-xs whitespace-nowrap"
          >
            <span
              aria-hidden
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: item.fill }}
            />
            <span className="font-medium">{item.name}</span>
            <span className="font-heading font-semibold">{item.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
