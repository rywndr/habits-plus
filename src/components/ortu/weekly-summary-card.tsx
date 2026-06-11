type Props = {
  content: string
  weekLabel: string | null
}

export function WeeklySummaryCard({ content, weekLabel }: Props) {
  const paragraphs = content
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-card p-6 ring-1 ring-foreground/5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-semibold">
          Ringkasan Minggu Ini
        </h2>
        {weekLabel ? (
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            {weekLabel}
          </span>
        ) : null}
      </div>

      {paragraphs.length ? (
        <div className="flex flex-col gap-3 text-sm leading-relaxed sm:text-base">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          Belum ada ringkasan untuk minggu ini.
        </p>
      )}

      <p className="text-xs italic text-muted-foreground">
        Informasi ini bersifat ringkasan dan bukan penilaian individu.
      </p>
    </section>
  )
}
