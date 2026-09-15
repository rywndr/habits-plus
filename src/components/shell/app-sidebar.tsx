import type { MouseEvent } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarSeparator,
  useSidebar,
} from '#/components/ui/sidebar'
import { Avatar, AvatarFallback } from '#/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '#/components/ui/dropdown-menu'
import { ChevronsUpDown, LoaderCircle, LogOut } from 'lucide-react'
import { SidebarBrand } from './sidebar-brand'
import { SidebarNavGroup, SidebarNavItem } from './sidebar-nav-item'
import type { NavEntry } from './sidebar-nav-item'

type Props = {
  userName: string
  userEmail: string
  schoolName: string
  items: Array<NavEntry>
  onLogout: () => void
  isLoggingOut: boolean
  logoutError: string | null
}

function getInitials(name: string) {
  const parts = name.split(' ').filter(Boolean).slice(0, 2)
  return parts.map((part) => part[0].toUpperCase()).join('') || '?'
}

export function AppSidebar({
  userName,
  userEmail,
  schoolName,
  items,
  onLogout,
  isLoggingOut,
  logoutError,
}: Props) {
  const { isMobile, setOpenMobile } = useSidebar()

  function handleNavigationClick(event: MouseEvent<HTMLDivElement>) {
    if (
      !isMobile ||
      !(event.target instanceof Element) ||
      !event.target.closest('a[href]')
    ) {
      return
    }

    setOpenMobile(false)
  }

  return (
    <Sidebar
      collapsible="offcanvas"
      className="group-data-[side=left]:border-r-0"
    >
      <SidebarHeader className="p-4">
        <SidebarBrand schoolName={schoolName} />
      </SidebarHeader>
      <SidebarSeparator className="mx-4" />
      <SidebarContent onClick={handleNavigationClick}>
        <SidebarGroup className="px-3 py-4">
          <SidebarGroupLabel className="px-2 tracking-wide text-sidebar-foreground/50 uppercase">
            Menu
          </SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {items.map((item) => {
              switch (item.kind) {
                case 'group':
                  return <SidebarNavGroup key={item.label} group={item} />
                case 'link':
                  return <SidebarNavItem key={item.href} item={item} />
                default: {
                  const unhandled: never = item
                  return unhandled
                }
              }
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarSeparator className="mx-4" />
      <SidebarFooter className="gap-3 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="flex w-full min-w-0 items-center gap-2.5 rounded-lg p-2 text-left outline-none hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring data-popup-open:bg-sidebar-accent"
            aria-label={`Menu profil ${userName}`}
          >
            <Avatar>
              <AvatarFallback className="bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-sm leading-none font-medium text-sidebar-foreground">
                {userName}
              </span>
              <span
                className="truncate text-xs leading-none text-sidebar-foreground/70"
                title={userEmail}
              >
                {userEmail}
              </span>
            </div>
            <ChevronsUpDown className="size-4 shrink-0" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            sideOffset={8}
            className="w-40"
          >
            <DropdownMenuItem
              variant="destructive"
              className="gap-2 p-2"
              onClick={onLogout}
              closeOnClick={false}
              disabled={isLoggingOut}
              aria-busy={isLoggingOut}
            >
              {isLoggingOut ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                <LogOut aria-hidden="true" />
              )}
              {isLoggingOut ? 'Sedang keluar...' : 'Keluar'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <span role="status" className="sr-only">
          {isLoggingOut ? 'Sedang keluar...' : ''}
        </span>
        {logoutError && (
          <p role="alert" className="text-xs text-destructive">
            {logoutError}
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
