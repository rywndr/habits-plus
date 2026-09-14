import { Outlet, createFileRoute } from '@tanstack/react-router'
import { Home } from 'lucide-react'
import { AppShell } from '#/components/shell/app-shell'
import type { NavEntry } from '#/components/shell/sidebar-nav-item'
import { loadCurrentUser } from '#/server/loaders'

export const Route = createFileRoute('/ortu')({
  loader: () => loadCurrentUser({ data: { role: 'ortu' } }),
  staleTime: Infinity,
  component: OrtuShell,
})

function OrtuShell() {
  const user = Route.useLoaderData()

  const items: Array<NavEntry> = [
    {
      kind: 'link',
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
