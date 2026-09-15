import { Skeleton } from '#/components/ui/skeleton'

export function ObservationCardsSkeleton({
  kind,
}: {
  kind: 'daily' | 'weekly'
}) {
  return (
    <div role="status" className="grid gap-3 lg:hidden">
      <span className="sr-only">Memuat observasi...</span>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="rounded-xl bg-card p-4 ring-1 ring-foreground/5"
          aria-hidden="true"
        >
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-2 h-3 w-1/3" />
          <div
            className={
              kind === 'daily'
                ? 'mt-4 grid gap-4 sm:grid-cols-2'
                : 'mt-4 grid gap-4'
            }
          >
            {Array.from({ length: kind === 'daily' ? 4 : 3 }, (_, field) => (
              <div key={field} className="grid gap-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton
                  className={
                    kind === 'daily'
                      ? 'h-11 w-full rounded-full'
                      : 'h-16 w-full'
                  }
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
