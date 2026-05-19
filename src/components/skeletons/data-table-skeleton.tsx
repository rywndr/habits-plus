import { ContentPanel } from '#/components/shell/content-panel'
import { Skeleton } from '#/components/ui/skeleton'

type Props = {
  columns: number
  rows?: number
  showToolbarButton?: boolean
}

export function DataTableSkeleton({
  columns,
  rows = 6,
  showToolbarButton = true,
}: Props) {
  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <Skeleton className="h-9 w-56 sm:h-10 sm:w-64" />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-8 w-full max-w-sm rounded-full" />
            {showToolbarButton ? (
              <Skeleton className="h-9 w-32 rounded-md" />
            ) : null}
          </div>

          <div className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/5">
            <div className="flex items-center gap-4 bg-brand-table-header px-4 py-3">
              {Array.from({ length: columns + 1 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-3 flex-1 bg-brand-navy-foreground/30"
                />
              ))}
            </div>
            <div className="flex flex-col divide-y divide-border/40">
              {Array.from({ length: rows }).map((_, r) => (
                <div key={r} className="flex items-center gap-4 px-4 py-4">
                  {Array.from({ length: columns + 1 }).map((_, c) => (
                    <Skeleton key={c} className="h-3 flex-1" />
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
      </div>
    </ContentPanel>
  )
}
