import { Outlet, createFileRoute, useMatches } from '@tanstack/react-router'
import {
  Home,
  GraduationCap,
  Users,
  BookOpen,
  UserCircle2,
  FileSpreadsheet,
} from 'lucide-react'
import { AppShell } from '#/components/shell/app-shell'
import type { NavItem } from '#/components/shell/sidebar-nav-item'
import { loadCurrentUser } from '#/server/loaders'

export const Route = createFileRoute('/admin')({
  loader: () => loadCurrentUser({ data: { role: 'admin' } }),
  staleTime: Infinity,
  component: AdminShell,
})

function AdminShell() {
  const user = Route.useLoaderData()

  const items: Array<NavItem> = [
    {
      to: '/admin',
      href: '/admin',
      label: 'beranda',
      icon: Home,
    },
    {
      to: '/admin/guru',
      href: '/admin/guru',
      label: 'kelola guru',
      icon: GraduationCap,
    },
    {
      to: '/admin/siswa',
      href: '/admin/siswa',
      label: 'kelola siswa',
      icon: Users,
    },
    {
      to: '/admin/kelas',
      href: '/admin/kelas',
      label: 'kelola kelas',
      icon: BookOpen,
    },
    {
      to: '/admin/ortu',
      href: '/admin/ortu',
      label: 'kelola orang tua',
      icon: UserCircle2,
    },
    {
      to: '/admin/data-massal',
      href: '/admin/data-massal',
      label: 'data massal',
      icon: FileSpreadsheet,
    },
  ]

  const matches = useMatches()
  const lastMatch = matches[matches.length - 1]
  const mobileTitle =
    (lastMatch.staticData as { title?: string }).title ?? 'Admin'

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
