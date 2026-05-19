import type { ReactNode } from 'react'
import { cn } from '#/lib/utils'

type Props = {
  title: ReactNode
  className?: string
}

export function PageHeader({ title, className }: Props) {
  return (
    <h1
      className={cn(
        'font-heading text-3xl font-semibold text-foreground sm:text-4xl',
        className,
      )}
    >
      {title}
    </h1>
  )
}
