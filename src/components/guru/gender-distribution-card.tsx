import { cn } from '#/lib/utils'

type Props = {
  laki: number
  perempuan: number
  className?: string
}

function Bar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="font-heading font-semibold text-foreground">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full', color)}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export function GenderDistributionCard({ laki, perempuan, className }: Props) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/5',
        className,
      )}
    >
      <span className="text-center text-xs font-bold tracking-wide text-brand-navy uppercase">
        Kelompok Siswa
        <br />
        Berdasarkan Jenis Kelamin
      </span>
      <div className="flex flex-col gap-3">
        <Bar label="Laki-laki" value={laki} color="bg-brand-navy" />
        <Bar label="Perempuan" value={perempuan} color="bg-brand-orange" />
      </div>
    </div>
  )
}
