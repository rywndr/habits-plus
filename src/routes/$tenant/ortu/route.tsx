import { Outlet, createFileRoute } from '@tanstack/react-router'
import { Home } from 'lucide-react'
import { AppShell } from '#/components/shell/app-shell'
import type { NavItem } from '#/components/shell/sidebar-nav-item'
import { loadCurrentUser } from '#/server/loaders'

export const Route = createFileRoute('/$tenant/ortu')({
  beforeLoad: ({ params }) =>
    loadCurrentUser({ data: { tenant: params.tenant, role: 'ortu' } }).then(
      (user) => ({ user }),
    ),
  component: OrtuShell,
})

function OrtuShell() {
  const { tenant } = Route.useParams()
  const { user } = Route.useRouteContext()

  const items: Array<NavItem> = [
    {
      to: '/$tenant/ortu',
      params: { tenant },
      href: `/${tenant}/ortu`,
      label: 'Dashboard',
      icon: Home,
    },
  ]

  return (
    <AppShell
      userName={user.name}
      userEmail={user.email}
      navItems={items}
      mobileTitle="Lihat Progres"
      tenant={tenant}
    >
      <Outlet />
    </AppShell>
  )
}
