import { ContentPanel } from '#/components/shell/content-panel'
import { Skeleton } from '#/components/ui/skeleton'

export function AdminDashboardSkeleton() {
  return (
    <ContentPanel>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-56 sm:h-10 sm:w-64" />
          <Skeleton className="h-4 w-40" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-foreground/5"
            >
              <Skeleton className="size-12 rounded-xl" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-12" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-foreground/5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </ContentPanel>
  )
}
