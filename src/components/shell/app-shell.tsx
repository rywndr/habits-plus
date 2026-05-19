import type { ReactNode } from 'react'
import { SidebarInset, SidebarProvider } from '#/components/ui/sidebar'
import { AppSidebar } from './app-sidebar'
import { MobileHeader } from './mobile-header'
import type { NavItem } from './sidebar-nav-item'

type Props = {
  userName: string
  userEmail: string
  navItems: Array<NavItem>
  mobileTitle: string
  children: ReactNode
}

export function AppShell({
  userName,
  userEmail,
  navItems,
  mobileTitle,
  children,
}: Props) {
  return (
    <SidebarProvider defaultOpen={true} className="bg-brand-navy">
      <AppSidebar
        userName={userName}
        userEmail={userEmail}
        items={navItems}
      />
      <SidebarInset className="bg-brand-navy">
        <MobileHeader title={mobileTitle} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
