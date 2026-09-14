import { useId } from 'react'
import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'

export function HeaderFilters({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
      {children}
    </div>
  )
}

export function HeaderFilter({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  const labelId = useId()

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      className={cn('flex min-w-0 flex-col gap-2', className)}
    >
      <span id={labelId} className="text-sm font-medium text-muted-foreground">
        {label}
      </span>
      <div className="min-w-0 [&>button]:min-h-11 [&>button]:w-full [&>div]:w-full lg:[&>button]:w-auto lg:[&>div]:w-auto">
        {children}
      </div>
    </div>
  )
}
