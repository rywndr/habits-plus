import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '#/components/ui/pagination'

type Props = {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function TablePagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null

  return (
    <Pagination className="justify-end">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            text="Sebelumnya"
            onClick={(event) => {
              event.preventDefault()
              onPageChange(Math.max(1, page - 1))
            }}
          />
        </PaginationItem>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
          (n) => (
            <PaginationItem key={n}>
              <PaginationLink
                href="#"
                isActive={n === page}
                onClick={(event) => {
                  event.preventDefault()
                  onPageChange(n)
                }}
              >
                {n}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            href="#"
            text="Berikutnya"
            onClick={(event) => {
              event.preventDefault()
              onPageChange(Math.min(totalPages, page + 1))
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
