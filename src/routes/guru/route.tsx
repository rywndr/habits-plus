import { Outlet, createFileRoute, useMatches } from '@tanstack/react-router'
import {
  Home,
  ClipboardEdit,
  BarChart3,
  CalendarRange,
  PenLine,
  Sparkles,
} from 'lucide-react'
import { AppShell } from '#/components/shell/app-shell'
import type { NavGroup, NavItem } from '#/components/shell/sidebar-nav-item'
import { loadCurrentUser } from '#/server/loaders'

export const Route = createFileRoute('/guru')({
  loader: () => loadCurrentUser({ data: { role: 'guru' } }),
  staleTime: Infinity,
  component: GuruShell,
})

function GuruShell() {
  const user = Route.useLoaderData()

  const items: Array<NavItem | NavGroup> = [
    {
      to: '/guru',
      href: '/guru',
      label: 'beranda',
      icon: Home,
    },
    {
      to: '/guru/catat-observasi',
      href: '/guru/catat-observasi',
      label: 'catat observasi',
      icon: ClipboardEdit,
    },
    {
      to: '/guru/ringkasan',
      href: '/guru/ringkasan',
      label: 'lihat ringkasan',
      icon: BarChart3,
    },
    {
      to: '/guru/observasi-mingguan',
      href: '/guru/observasi-mingguan',
      label: 'observasi mingguan',
      icon: CalendarRange,
    },
    {
      label: 'ringkasan',
      icon: Sparkles,
      items: [
        {
          to: '/guru/ringkasan-ai',
          href: '/guru/ringkasan-ai',
          label: 'ringkasan AI',
          icon: Sparkles,
        },
        {
          to: '/guru/ringkasan-manual',
          href: '/guru/ringkasan-manual',
          label: 'ringkasan manual',
          icon: PenLine,
        },
      ],
    },
  ]

  const matches = useMatches()
  const lastMatch = matches[matches.length - 1]
  const mobileTitle =
    (lastMatch.staticData as { title?: string }).title ?? 'Habits+'

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
