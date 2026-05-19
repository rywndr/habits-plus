import { BrandLogo } from '#/components/common/brand-logo'

type Props = {
  name: string
  email: string
}

export function SidebarBrand({ name, email }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
      <BrandLogo size={88} />
      <div className="flex flex-col gap-0.5">
        <span className="font-heading text-lg font-semibold text-sidebar-foreground">
          {name}
        </span>
        <span className="text-xs text-sidebar-foreground/70">{email}</span>
      </div>
    </div>
  )
}
