import { Outlet, createFileRoute, useMatches } from '@tanstack/react-router'
import {
  Home,
  GraduationCap,
  Users,
  BookOpen,
  UserCircle2,
} from 'lucide-react'
import { AppShell } from '#/components/shell/app-shell'
import type { NavItem } from '#/components/shell/sidebar-nav-item'
import { getCurrentUser } from '#/data'

export const Route = createFileRoute('/$tenant/admin')({ component: AdminShell })

function AdminShell() {
  const { tenant } = Route.useParams()
  const user = getCurrentUser('admin')

  const items: Array<NavItem> = [
    { to: '/$tenant/admin', params: { tenant }, href: `/${tenant}/admin`, label: 'beranda', icon: Home },
    { to: '/$tenant/admin/guru', params: { tenant }, href: `/${tenant}/admin/guru`, label: 'kelola guru', icon: GraduationCap },
    { to: '/$tenant/admin/siswa', params: { tenant }, href: `/${tenant}/admin/siswa`, label: 'kelola siswa', icon: Users },
    { to: '/$tenant/admin/kelas', params: { tenant }, href: `/${tenant}/admin/kelas`, label: 'kelola kelas', icon: BookOpen },
    { to: '/$tenant/admin/ortu', params: { tenant }, href: `/${tenant}/admin/ortu`, label: 'kelola orang tua', icon: UserCircle2 },
  ]

  const matches = useMatches()
  const lastMatch = matches[matches.length - 1]
  const mobileTitle =
    (lastMatch.staticData as { title?: string }).title ?? 'Admin'

  return (
    <AppShell
      userName={user.name}
      userEmail={user.email}
      navItems={items}
      mobileTitle={mobileTitle}
    >
      <Outlet />
    </AppShell>
  )
}
