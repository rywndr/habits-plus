import { Skeleton } from '#/components/ui/skeleton'
import { ContentPanel } from '#/components/shell/content-panel'

export function ParentReportTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/5">
      <div className="flex items-center gap-4 bg-brand-table-header px-4 py-3">
        {[...Array(4).keys()].map((i) => (
          <Skeleton
            key={i}
            className="h-3 flex-1 bg-brand-navy-foreground/30 max-sm:[&:nth-child(n+3)]:hidden"
          />
        ))}
      </div>
      <div className="flex flex-col divide-y divide-border/40">
        {[...Array(8).keys()].map((rowIndex) => (
          <div
            key={rowIndex}
            className="flex items-center gap-4 px-4 py-6 sm:py-4"
          >
            {[...Array(4).keys()].map((cellIndex) => (
              <Skeleton
                key={cellIndex}
                className="h-3 flex-1 max-sm:[&:nth-child(n+3)]:hidden"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ParentReportPageSkeleton() {
  return (
    <ContentPanel className="min-w-0">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Skeleton className="h-10 w-80 max-w-full rounded-full" />
          <Skeleton className="h-10 w-36 rounded-full" />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-10 w-48 rounded-full" />
        </div>
        <ParentReportTableSkeleton />
      </div>
    </ContentPanel>
  )
}
