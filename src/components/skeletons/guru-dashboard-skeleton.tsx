import { ContentPanel } from '#/components/shell/content-panel'
import { Skeleton } from '#/components/ui/skeleton'

export function GuruDashboardSkeleton() {
  return (
    <ContentPanel>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-56 sm:h-10 sm:w-64" />

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-6 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/5"
              >
                <div className="flex items-start justify-between gap-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="size-8 rounded-md" />
                </div>
                <Skeleton className="h-5 w-32" />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-5 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/5 lg:justify-between lg:gap-2 lg:p-4">
            <Skeleton className="mx-auto h-3 w-40" />
            <Skeleton className="mx-auto size-44 max-w-full rounded-full lg:size-36" />
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <Skeleton className="size-3 rounded-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </ContentPanel>
  )
}
