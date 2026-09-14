import { School } from 'lucide-react'
import { BrandLogo } from '#/components/common/brand-logo'

type Props = {
  schoolName: string
}

export function SidebarBrand({ schoolName }: Props) {
  return (
    <div className="flex items-center gap-3">
      <BrandLogo size={40} />
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-heading text-base leading-none font-semibold text-sidebar-foreground">
          Habits+
        </span>
        <span
          className="flex min-w-0 items-center gap-1.5 text-xs leading-none text-sidebar-foreground/70"
          title={schoolName}
        >
          <School className="size-3 shrink-0" />
          <span className="truncate">{schoolName}</span>
        </span>
      </div>
    </div>
  )
}
