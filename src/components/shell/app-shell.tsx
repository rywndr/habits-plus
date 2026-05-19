import type { ReactNode } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { SidebarInset, SidebarProvider } from '#/components/ui/sidebar'
import { authClient } from '#/lib/auth-client'
import { AppSidebar } from './app-sidebar'
import { MobileHeader } from './mobile-header'
import type { NavItem } from './sidebar-nav-item'

type Props = {
  userName: string
  userEmail: string
  navItems: Array<NavItem>
  mobileTitle: string
  tenant: string
  children: ReactNode
}

export function AppShell({
  userName,
  userEmail,
  navItems,
  mobileTitle,
  tenant,
  children,
}: Props) {
  const navigate = useNavigate()

  async function handleLogout() {
    await authClient.signOut()
    await navigate({ to: '/$tenant/login', params: { tenant } })
  }

  return (
    <SidebarProvider defaultOpen={true} className="bg-brand-navy">
      <AppSidebar
        userName={userName}
        userEmail={userEmail}
        items={navItems}
        onLogout={() => void handleLogout()}
      />
      <SidebarInset className="bg-brand-navy">
        <MobileHeader title={mobileTitle} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
