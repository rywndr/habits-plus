import { BrandLogo } from '#/components/common/brand-logo'
import { ContentPanel } from '#/components/shell/content-panel'
import { Skeleton } from '#/components/ui/skeleton'

type Props = {
  navItemsCount?: number
}

export function AppShellSkeleton({ navItemsCount = 4 }: Props) {
  return (
    <div className="flex min-h-svh bg-brand-navy">
      <aside className="hidden w-64 shrink-0 flex-col p-4 md:flex">
        <div className="flex items-center gap-3">
          <BrandLogo size={40} />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-3 w-20 bg-sidebar-foreground/25" />
            <Skeleton className="h-2 w-28 bg-sidebar-foreground/15" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5 pt-8">
          {Array.from({ length: navItemsCount }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-12 w-full rounded-md bg-sidebar-foreground/10"
            />
          ))}
        </div>
        <div className="mt-auto flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 shrink-0 rounded-full bg-sidebar-foreground/20" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-3 w-24 bg-sidebar-foreground/25" />
              <Skeleton className="h-2 w-28 bg-sidebar-foreground/15" />
            </div>
          </div>
          <Skeleton className="h-9 w-full rounded-lg bg-sidebar-foreground/10" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-brand-navy px-3 py-2 md:hidden">
          <Skeleton className="size-7 rounded-md bg-sidebar-foreground/20" />
          <BrandLogo size={32} />
          <Skeleton className="h-4 w-32 bg-sidebar-foreground/20" />
        </header>

        <ContentPanel>
          <div className="flex flex-col gap-6">
            <Skeleton className="h-9 w-56 sm:h-10 sm:w-64" />
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        </ContentPanel>
      </div>
    </div>
  )
}
