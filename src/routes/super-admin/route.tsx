import { Outlet, createFileRoute, useMatches } from '@tanstack/react-router'
import { Building2, ShieldPlus } from 'lucide-react'
import { AppShell } from '#/components/shell/app-shell'
import type { NavItem } from '#/components/shell/sidebar-nav-item'
import { loadCurrentUser } from '#/server/loaders'

export const Route = createFileRoute('/super-admin')({
  loader: () => loadCurrentUser({ data: { role: 'super-admin' } }),
  staleTime: Infinity,
  component: SuperAdminShell,
})

function SuperAdminShell() {
  const user = Route.useLoaderData()
  const items: Array<NavItem> = [
    {
      to: '/super-admin',
      href: '/super-admin',
      label: 'tambah sekolah',
      icon: Building2,
    },
    {
      to: '/super-admin/admin-sekolah',
      href: '/super-admin/admin-sekolah',
      label: 'admin sekolah',
      icon: ShieldPlus,
    },
  ]

  const matches = useMatches()
  const lastMatch = matches[matches.length - 1]
  const mobileTitle =
    (lastMatch.staticData as { title?: string }).title ?? 'Super Admin'

  return (
    <AppShell
      userName={user.name}
      userEmail={user.email}
      schoolName={user.schoolName}
      navItems={items}
      mobileTitle={mobileTitle}
    >
      <Outlet />
    </AppShell>
  )
}
