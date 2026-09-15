import type { ReactElement } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '#/components/ui/button'

type AddEntityLinkProps = {
  link: ReactElement
  label?: string
}

export function AddEntityLink({ link, label = 'Tambah' }: AddEntityLinkProps) {
  return (
    <Button
      render={link}
      nativeButton={false}
      size="lg"
      className="gap-2 rounded-full"
    >
      <Plus />
      {label}
    </Button>
  )
}
