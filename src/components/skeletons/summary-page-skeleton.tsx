import { ContentPanel } from '#/components/shell/content-panel'
import { Skeleton } from '#/components/ui/skeleton'

export function SummaryPageSkeleton() {
  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <Skeleton className="h-9 w-56 sm:h-10 sm:w-64" />

        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-40 rounded-md" />
        </div>

        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Skeleton className="h-72 w-full rounded-2xl" />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-stretch overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/5"
              >
                <Skeleton className="h-auto w-2 shrink-0 rounded-none" />
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-5 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ContentPanel>
  )
}
