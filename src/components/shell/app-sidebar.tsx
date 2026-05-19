import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
} from '#/components/ui/sidebar'
import { SidebarBrand } from './sidebar-brand'
import { SidebarNavItem  } from './sidebar-nav-item'
import type {NavItem} from './sidebar-nav-item';

type Props = {
  userName: string
  userEmail: string
  items: Array<NavItem>
}

export function AppSidebar({ userName, userEmail, items }: Props) {
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
    </Sidebar>
  )
}
