import { Skeleton } from '#/components/ui/skeleton'
import { ContentPanel } from '#/components/shell/content-panel'

export function AiSummaryTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/5">
      <div className="flex items-center gap-4 bg-brand-table-header px-4 py-3">
        {[...Array(5).keys()].map((i) => (
          <Skeleton
            key={i}
            className="h-3 flex-1 bg-brand-navy-foreground/30"
          />
        ))}
      </div>
      <div className="flex flex-col divide-y divide-border/40">
        {[...Array(8).keys()].map((rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 px-4 py-4">
            {[...Array(5).keys()].map((cellIndex) => (
              <Skeleton key={cellIndex} className="h-3 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function AiSummaryPageSkeleton() {
  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <Skeleton className="h-8 w-72" />
        <div className="flex justify-between">
          <Skeleton className="h-10 w-80 rounded-full" />
          <Skeleton className="h-10 w-36 rounded-full" />
        </div>
        <div className="flex gap-2">
          {[...Array(3).keys()].map((i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full" />
          ))}
        </div>
        <AiSummaryTableSkeleton />
      </div>
    </ContentPanel>
  )
}
