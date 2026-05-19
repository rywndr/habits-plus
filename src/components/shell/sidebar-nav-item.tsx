import type { LucideIcon } from 'lucide-react'
import type { LinkProps } from '@tanstack/react-router'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from '#/components/ui/sidebar'

export type NavItem = Pick<LinkProps, 'to' | 'params'> & {
  label: string
  icon: LucideIcon
  /** resolved href used for active comparison (e.g. `/demo/guru`) */
  href: string
}

type Props = {
  item: NavItem
}

export function SidebarNavItem({ item }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const Icon = item.icon
  const isActive = pathname === item.href

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        size="lg"
        tooltip={item.label}
        render={<Link to={item.to} params={item.params} />}
      >
        <Icon />
        <span className="text-base lowercase">{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}
