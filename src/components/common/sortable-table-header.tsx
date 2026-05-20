import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#/components/ui/tooltip'
import { cn } from '#/lib/utils'
import type { SortDirection } from '#/hooks/use-sortable-data'

type Props = {
  label: string
  direction?: SortDirection
  className?: string
  onClick: () => void
}

export function SortableTableHeader({
  label,
  direction,
  className,
  onClick,
}: Props) {
  const Icon =
    direction === 'asc' ? ArrowUp : direction === 'desc' ? ArrowDown : ArrowUpDown
  const description =
    direction === 'asc'
      ? `Urutkan ${label} menurun`
      : `Urutkan ${label} menaik`

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              '-mx-2 h-7 justify-start px-2 text-inherit hover:bg-background/15 hover:text-inherit',
              className,
            )}
            aria-label={description}
            aria-sort={
              direction === 'asc'
                ? 'ascending'
                : direction === 'desc'
                  ? 'descending'
                  : 'none'
            }
            onClick={onClick}
          />
        }
      >
        <span>{label}</span>
        <Icon className="size-3.5" aria-hidden="true" />
      </TooltipTrigger>
      <TooltipContent>{description}</TooltipContent>
    </Tooltip>
  )
}
