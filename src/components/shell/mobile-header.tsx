import { SidebarTrigger } from '#/components/ui/sidebar'
import { BrandLogo } from '#/components/common/brand-logo'

type Props = {
  title: string
}

export function MobileHeader({ title }: Props) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-brand-navy px-3 py-2 text-brand-navy-foreground md:hidden">
      <SidebarTrigger className="text-brand-navy-foreground hover:bg-brand-navy-hover" />
      <BrandLogo size={32} />
      <span className="font-heading text-base font-semibold">{title}</span>
    </header>
  )
}
