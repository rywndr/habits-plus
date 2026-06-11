import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { LoaderCircle } from 'lucide-react'
import { routeTree } from './routeTree.gen'

// Fallback for routes without their own pendingComponent — without one the
// router keeps the previous page on screen until the destination loader
// resolves, making navigation feel stuck.
function DefaultPending() {
  return (
    <div className="flex min-h-48 flex-1 items-center justify-center p-8">
      <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 30_000,
    defaultPendingMs: 80,
    defaultPendingMinMs: 300,
    defaultPendingComponent: DefaultPending,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
