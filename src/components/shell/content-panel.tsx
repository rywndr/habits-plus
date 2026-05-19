import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'

type Props = {
  children: ReactNode
  className?: string
}

export function ContentPanel({ children, className }: Props) {
  return (
    <div
      className={cn(
        'min-h-svh flex-1 bg-brand-panel md:m-4 md:min-h-[calc(100svh-2rem)] md:rounded-3xl',
        'p-4 sm:p-6 md:p-8',
        className,
      )}
    >
      {children}
    </div>
  )
}
