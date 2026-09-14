import type { ReactNode } from 'react'
import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { SidebarInset, SidebarProvider } from '#/components/ui/sidebar'
import { authClient } from '#/lib/auth-client'
import { AppSidebar } from './app-sidebar'
import { MobileHeader } from './mobile-header'
import type { NavEntry } from './sidebar-nav-item'

type Props = {
  userName: string
  userEmail: string
  schoolName: string
  navItems: Array<NavEntry>
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
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutError, setLogoutError] = useState<string | null>(null)

  async function handleLogout() {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    setLogoutError(null)
    try {
      const result = await authClient.signOut()
      if (result.error) {
        setLogoutError('Gagal keluar. Silakan coba lagi.')
        return
      }
      await router.navigate({ to: '/login' })
      // Drop the signed-out user's cached loader data so it can't be rendered
      // again (e.g. via the back button) without re-authenticating.
      await router.invalidate()
    } catch {
      setLogoutError('Gagal keluar. Silakan coba lagi.')
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <SidebarProvider defaultOpen={true} className="bg-brand-navy">
      <AppSidebar
        userName={userName}
        userEmail={userEmail}
        schoolName={schoolName}
        items={navItems}
        onLogout={() => void handleLogout()}
        isLoggingOut={isLoggingOut}
        logoutError={logoutError}
      />
      <SidebarInset className="bg-brand-navy">
        <MobileHeader title={mobileTitle} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
