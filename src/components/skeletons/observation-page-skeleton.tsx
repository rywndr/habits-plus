import { ContentPanel } from '#/components/shell/content-panel'
import { Skeleton } from '#/components/ui/skeleton'

export function ObservationPageSkeleton() {
  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <Skeleton className="h-9 w-56 sm:h-10 sm:w-64" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-7 w-40 rounded-full" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-40 rounded-md" />
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Skeleton className="mb-2 h-3 w-36" />
            <Skeleton className="h-8 w-full rounded-full" />
          </div>
          <Skeleton className="h-11 w-28 rounded-full" />
        </div>

        <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/5">
          <div className="flex items-center gap-4 px-4 py-3">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 flex-1" />
            <Skeleton className="h-3 w-20" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-20 bg-brand-navy/15" />
            ))}
          </div>
          <div className="flex flex-col divide-y divide-border/40">
            {Array.from({ length: 8 }).map((_, r) => (
              <div key={r} className="flex items-center gap-4 px-4 py-4">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-3 flex-1" />
                <Skeleton className="h-3 w-20" />
                {Array.from({ length: 4 }).map((_, c) => (
                  <Skeleton key={c} className="h-6 w-20 rounded-full" />
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="size-9 rounded-md" />
          ))}
        </div>
      </div>
    </ContentPanel>
  )
}
