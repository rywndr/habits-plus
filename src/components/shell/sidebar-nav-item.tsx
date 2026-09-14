import { useEffect, useId, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { LinkProps } from '@tanstack/react-router'
import { Link, useRouterState } from '@tanstack/react-router'
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '#/components/ui/sidebar'
import { cn } from '#/lib/utils'

export type NavItem = Pick<LinkProps, 'to' | 'params'> & {
  kind: 'link'
  label: string
  icon: LucideIcon
  /** resolved href used for active comparison (e.g. `/demo/guru`) */
  href: string
}

/** Non-navigating parent entry that expands into nested links. */
export type NavGroup = {
  kind: 'group'
  label: string
  icon: LucideIcon
  items: Array<NavItem>
}

export type NavEntry = NavItem | NavGroup

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
        <Icon className={cn(isActive && 'text-sidebar-primary')} />
        <span>{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

export function SidebarNavGroup({ group }: { group: NavGroup }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const Icon = group.icon
  const hasActiveChild = group.items.some((item) => pathname === item.href)
  const [isOpen, setIsOpen] = useState(hasActiveChild)
  const submenuId = useId()

  useEffect(() => {
    if (hasActiveChild) setIsOpen(true)
  }, [hasActiveChild])

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={hasActiveChild}
        size="lg"
        tooltip={group.label}
        aria-expanded={isOpen}
        aria-controls={isOpen ? submenuId : undefined}
        onClick={() => setIsOpen((open) => !open)}
      >
        <Icon className={cn(hasActiveChild && 'text-sidebar-primary')} />
        <span>{group.label}</span>
        <ChevronDown
          className={cn(
            'ml-auto text-sidebar-foreground/60 transition-transform',
            isOpen && 'rotate-180',
          )}
        />
      </SidebarMenuButton>
      {isOpen ? (
        <SidebarMenuSub id={submenuId} className="mt-1 gap-1">
          {group.items.map((item) => (
            <SidebarMenuSubItem key={item.href}>
              <SidebarMenuSubButton
                isActive={pathname === item.href}
                className="h-9"
                render={<Link to={item.to} params={item.params} />}
              >
                <span>{item.label}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      ) : null}
    </SidebarMenuItem>
  )
}
