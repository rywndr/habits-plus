import type { ReactNode } from 'react'

type Props = {
  classId: string
  children: ReactNode
}

export function ClassRequiredContent({ classId, children }: Props) {
  if (!classId) {
    return (
      <p
        role="status"
        className="rounded-2xl bg-card px-4 py-3 text-sm text-muted-foreground ring-1 ring-foreground/5"
      >
        Pilih kelas terlebih dahulu untuk menampilkan data.
      </p>
    )
  }

  return children
}
