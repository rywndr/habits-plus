import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '#/lib/utils'

export type SummaryHistoryItem = {
  id: string
  weekLabel: string
  content: string
}

type Props = {
  items: Array<SummaryHistoryItem>
}

export function SummaryHistoryList({ items }: Props) {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-lg font-semibold">
        Ringkasan Minggu Sebelumnya
      </h2>
      {items.length === 0 ? (
        <p className="rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground ring-1 ring-foreground/5">
          Belum ada ringkasan dari minggu-minggu sebelumnya.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const isOpen = openId === item.id
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5"
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-muted/40"
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                >
                  <span className="text-sm font-medium">{item.weekLabel}</span>
                  <ChevronDown
                    className={cn(
                      'size-4 shrink-0 text-muted-foreground transition-transform',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>
                {isOpen ? (
                  <div className="flex flex-col gap-2 border-t border-border/40 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
                    {item.content
                      .split(/\n+/)
                      .map((paragraph) => paragraph.trim())
                      .filter(Boolean)
                      .map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
