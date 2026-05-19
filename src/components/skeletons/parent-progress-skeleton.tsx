import { ContentPanel } from '#/components/shell/content-panel'
import { Skeleton } from '#/components/ui/skeleton'

export function ParentProgressSkeleton() {
  return (
    <ContentPanel>
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-72 sm:h-10 sm:w-80" />

        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-3 w-3/4" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-3">
              <Skeleton className="size-36 rounded-full" />
              <div className="flex w-full flex-1 flex-col items-center gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </ContentPanel>
  )
}
