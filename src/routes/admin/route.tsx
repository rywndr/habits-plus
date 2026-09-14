import { Outlet, createFileRoute, useMatches } from '@tanstack/react-router'
import {
  Home,
  GraduationCap,
  Users,
  BookOpen,
  UserCircle2,
  FileSpreadsheet,
  Coins,
} from 'lucide-react'
import { AppShell } from '#/components/shell/app-shell'
import type { NavEntry } from '#/components/shell/sidebar-nav-item'
import { loadCurrentUser } from '#/server/loaders'

export const Route = createFileRoute('/admin')({
  loader: () => loadCurrentUser({ data: { role: 'admin' } }),
  staleTime: Infinity,
  component: AdminShell,
})

function AdminShell() {
  const user = Route.useLoaderData()

  const items: Array<NavEntry> = [
    {
      kind: 'link',
      to: '/admin',
      href: '/admin',
      label: 'Dashboard',
      icon: Home,
    },
    {
      kind: 'link',
      to: '/admin/guru',
      href: '/admin/guru',
      label: 'Kelola Guru',
      icon: GraduationCap,
    },
    {
      kind: 'link',
      to: '/admin/siswa',
      href: '/admin/siswa',
      label: 'Kelola Siswa',
      icon: Users,
    },
    {
      kind: 'link',
      to: '/admin/kelas',
      href: '/admin/kelas',
      label: 'Kelola Kelas',
      icon: BookOpen,
    },
    {
      kind: 'link',
      to: '/admin/ortu',
      href: '/admin/ortu',
      label: 'Kelola Orang Tua',
      icon: UserCircle2,
    },
    {
      kind: 'link',
      to: '/admin/data-massal',
      href: '/admin/data-massal',
      label: 'Data Massal',
      icon: FileSpreadsheet,
    },
    {
      kind: 'link',
      to: '/admin/biaya-ai',
      href: '/admin/biaya-ai',
      label: 'Biaya AI',
      icon: Coins,
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
