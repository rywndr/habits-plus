import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'

type Props = {
  children: ReactNode
  className?: string
}

export function GuruTableContainer({ children, className }: Props) {
  return (
    <div
      className={cn(
        'min-w-0 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/5',
        className,
      )}
    >
      {children}
    </div>
  )
}
