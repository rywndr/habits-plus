import { Outlet, createFileRoute } from '@tanstack/react-router'
import { Home } from 'lucide-react'
import { AppShell } from '#/components/shell/app-shell'
import type { NavItem } from '#/components/shell/sidebar-nav-item'
import { AppShellSkeleton } from '#/components/skeletons/app-shell-skeleton'
import { loadCurrentUser } from '#/server/loaders'

export const Route = createFileRoute('/ortu')({
  beforeLoad: () =>
    loadCurrentUser({ data: { role: 'ortu' } }).then((user) => ({ user })),
  component: OrtuShell,
  pendingComponent: () => <AppShellSkeleton navItemsCount={1} />,
})

function OrtuShell() {
  const { user } = Route.useRouteContext()

  const items: Array<NavItem> = [
    {
      to: '/ortu',
      href: '/ortu',
      label: 'Dashboard',
      icon: Home,
    },
  ]

  return (
    <AppShell
      userName={user.name}
      userEmail={user.email}
      schoolName={user.schoolName}
      navItems={items}
      mobileTitle="Lihat Progres"
    >
      <Outlet />
    </AppShell>
  )
}
