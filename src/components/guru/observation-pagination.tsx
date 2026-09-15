import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '#/components/ui/button'

type Props = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function ObservationPagination({
  page,
  totalPages,
  onPageChange,
}: Props) {
  if (totalPages <= 1) return null

  return (
    <nav
      aria-label="Halaman observasi"
      className="flex items-center justify-between gap-2 lg:justify-end lg:gap-4"
    >
      <Button
        variant="outline"
        className="size-11 shrink-0"
        aria-label="Halaman sebelumnya"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft aria-hidden="true" />
      </Button>
      <label className="flex min-w-0 items-center gap-2 text-sm">
        Halaman
        <select
          className="h-11 rounded-lg border border-input bg-card px-3 text-foreground focus-visible:outline-2 focus-visible:outline-ring"
          value={page}
          onChange={(event) => onPageChange(Number(event.target.value))}
        >
          {Array.from({ length: totalPages }, (_, index) => index + 1).map(
            (number) => (
              <option key={number} value={number}>
                {number}
              </option>
            ),
          )}
        </select>
        <span className="whitespace-nowrap">dari {totalPages}</span>
      </label>
      <Button
        variant="outline"
        className="size-11 shrink-0"
        aria-label="Halaman berikutnya"
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight aria-hidden="true" />
      </Button>
    </nav>
  )
}
