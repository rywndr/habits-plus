import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
} from '#/components/ui/sidebar'
import { Button } from '#/components/ui/button'
import { LogOut } from 'lucide-react'
import { SidebarBrand } from './sidebar-brand'
import { SidebarNavItem } from './sidebar-nav-item'
import type { NavItem } from './sidebar-nav-item'

type Props = {
  userName: string
  userEmail: string
  items: Array<NavItem>
  onLogout: () => void
}

export function AppSidebar({ userName, userEmail, items, onLogout }: Props) {
  return (
    <Sidebar
      collapsible="offcanvas"
      className="group-data-[side=left]:border-r-0"
    >
      <SidebarHeader className="p-0">
        <SidebarBrand name={userName} email={userEmail} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-1">
            {items.map((item) => (
              <SidebarNavItem key={item.to} item={item} />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-3">
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start gap-2 text-brand-navy-foreground/80 hover:text-brand-navy"
          onClick={onLogout}
        >
          <LogOut />
          Keluar
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
