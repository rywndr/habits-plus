import type { ReactNode } from 'react'
import { useRouter } from '@tanstack/react-router'
import { SidebarInset, SidebarProvider } from '#/components/ui/sidebar'
import { authClient } from '#/lib/auth-client'
import { AppSidebar } from './app-sidebar'
import { MobileHeader } from './mobile-header'
import type { NavItem } from './sidebar-nav-item'

type Props = {
  userName: string
  userEmail: string
  schoolName: string
  navItems: Array<NavItem>
  mobileTitle: string
  children: ReactNode
}

export function AppShell({
  userName,
  userEmail,
  schoolName,
  navItems,
  mobileTitle,
  children,
}: Props) {
  const router = useRouter()

  async function handleLogout() {
    await authClient.signOut()
    await router.navigate({ to: '/login' })
    // Drop the signed-out user's cached loader data so it can't be rendered
    // again (e.g. via the back button) without re-authenticating.
    await router.invalidate()
  }

  return (
    <SidebarProvider defaultOpen={true} className="bg-brand-navy">
      <AppSidebar
        userName={userName}
        userEmail={userEmail}
        schoolName={schoolName}
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
