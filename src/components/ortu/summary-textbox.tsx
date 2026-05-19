import { Textarea } from '#/components/ui/textarea'

type Props = {
  value: string
}

export function SummaryTextbox({ value }: Props) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm">Ringkasan Umum</label>
      <Textarea
        value={value}
        readOnly
        rows={2}
        className="rounded-2xl bg-card"
      />
      <p className="text-xs text-muted-foreground italic">
        Catatan: Informasi ini bersifat ringkasan dan tidak dimaksudkan sebagai
        penilaian individu
      </p>
    </div>
  )
}
