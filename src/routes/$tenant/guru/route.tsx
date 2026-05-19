import { Outlet, createFileRoute, useMatches } from '@tanstack/react-router'
import {
  Home,
  ClipboardEdit,
  BarChart3,
  CalendarRange,
} from 'lucide-react'
import { AppShell } from '#/components/shell/app-shell'
import type { NavItem } from '#/components/shell/sidebar-nav-item'
import { getCurrentUser } from '#/data'

export const Route = createFileRoute('/$tenant/guru')({ component: GuruShell })

function GuruShell() {
  const { tenant } = Route.useParams()
  const user = getCurrentUser('guru')

  const items: Array<NavItem> = [
    { to: '/$tenant/guru', params: { tenant }, href: `/${tenant}/guru`, label: 'beranda', icon: Home },
    { to: '/$tenant/guru/catat-observasi', params: { tenant }, href: `/${tenant}/guru/catat-observasi`, label: 'catat observasi', icon: ClipboardEdit },
    { to: '/$tenant/guru/ringkasan', params: { tenant }, href: `/${tenant}/guru/ringkasan`, label: 'lihat ringkasan', icon: BarChart3 },
    { to: '/$tenant/guru/observasi-mingguan', params: { tenant }, href: `/${tenant}/guru/observasi-mingguan`, label: 'observasi mingguan', icon: CalendarRange },
  ]

  const matches = useMatches()
  const lastMatch = matches[matches.length - 1]
  const mobileTitle =
    (lastMatch.staticData as { title?: string }).title ?? 'Habits+'

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
