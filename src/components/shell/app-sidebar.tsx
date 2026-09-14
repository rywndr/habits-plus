import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarSeparator,
} from '#/components/ui/sidebar'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import { Button } from '#/components/ui/button'
import { LogOut } from 'lucide-react'
import { SidebarBrand } from './sidebar-brand'
import { SidebarNavGroup, SidebarNavItem } from './sidebar-nav-item'
import type { NavEntry } from './sidebar-nav-item'

type Props = {
  userName: string
  userEmail: string
  schoolName: string
  items: Array<NavEntry>
  onLogout: () => void
}

function getInitials(name: string) {
  const parts = name.split(' ').filter(Boolean).slice(0, 2)
  return parts.map((part) => part[0].toUpperCase()).join('') || '?'
}

export function AppSidebar({
  userName,
  userEmail,
  schoolName,
  items,
  onLogout,
}: Props) {
  return (
    <Sidebar
      collapsible="offcanvas"
      className="group-data-[side=left]:border-r-0"
    >
      <SidebarHeader className="p-4">
        <SidebarBrand schoolName={schoolName} />
      </SidebarHeader>
      <SidebarSeparator className="mx-4" />
      <SidebarContent>
        <SidebarGroup className="px-3 py-4">
          <SidebarGroupLabel className="px-2 tracking-wide text-sidebar-foreground/50 uppercase">
            Menu
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {items.map((item) => {
              switch (item.kind) {
                case 'group':
                  return <SidebarNavGroup key={item.label} group={item} />
                case 'link':
                  return <SidebarNavItem key={item.href} item={item} />
                default: {
                  const unhandled: never = item
                  return unhandled
                }
              }
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator className="mx-4" />
      <SidebarFooter className="gap-3 p-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar>
            <AvatarFallback className="bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm leading-none font-medium text-sidebar-foreground">
              {userName}
            </span>
            <span
              className="truncate text-xs leading-none text-sidebar-foreground/70"
              title={userEmail}
            >
              {userEmail}
            </span>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className="w-full justify-start gap-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          onClick={onLogout}
        >
          <LogOut />
          Keluar
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
