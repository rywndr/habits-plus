import { Outlet, createFileRoute, useMatches } from '@tanstack/react-router'
import {
  Home,
  ClipboardEdit,
  BarChart3,
  CalendarRange,
  Send,
} from 'lucide-react'
import { AppShell } from '#/components/shell/app-shell'
import type { NavEntry } from '#/components/shell/sidebar-nav-item'
import { loadCurrentUser } from '#/server/loaders'

export const Route = createFileRoute('/guru')({
  loader: () => loadCurrentUser({ data: { role: 'guru' } }),
  staleTime: Infinity,
  component: GuruShell,
})

function GuruShell() {
  const user = Route.useLoaderData()

  // Ordered by cadence: daily, weekly, then monthly.
  const items: Array<NavEntry> = [
    {
      kind: 'link',
      to: '/guru',
      href: '/guru',
      label: 'Dashboard',
      icon: Home,
    },
    {
      kind: 'link',
      to: '/guru/catat-observasi',
      href: '/guru/catat-observasi',
      label: 'Observasi Harian',
      icon: ClipboardEdit,
    },
    {
      kind: 'link',
      to: '/guru/observasi-mingguan',
      href: '/guru/observasi-mingguan',
      label: 'Observasi Mingguan',
      icon: CalendarRange,
    },
    {
      kind: 'link',
      to: '/guru/laporan-orang-tua',
      href: '/guru/laporan-orang-tua',
      label: 'Laporan Orang Tua',
      icon: Send,
    },
    {
      kind: 'link',
      to: '/guru/ringkasan',
      href: '/guru/ringkasan',
      label: 'Ringkasan Bulanan',
      icon: BarChart3,
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
