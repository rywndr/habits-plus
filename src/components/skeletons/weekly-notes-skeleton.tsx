import { ContentPanel } from '#/components/shell/content-panel'
import { Skeleton } from '#/components/ui/skeleton'

export function WeeklyNotesSkeleton() {
  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <Skeleton className="h-9 w-56 sm:h-10 sm:w-64" />

        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-40 rounded-md" />
        </div>

        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Skeleton className="h-11 w-28 rounded-full" />
          <Skeleton className="h-11 w-28 rounded-full" />
        </div>

        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/5">
          <div className="flex items-center gap-4 bg-brand-table-header px-4 py-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-3 flex-1 bg-brand-navy-foreground/30"
              />
            ))}
          </div>
          <div className="flex flex-col divide-y divide-border/40">
            {Array.from({ length: 6 }).map((_, r) => (
              <div key={r} className="flex items-center gap-4 px-4 py-4">
                {Array.from({ length: 6 }).map((_, c) => (
                  <Skeleton key={c} className="h-3 flex-1" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </ContentPanel>
  )
}
