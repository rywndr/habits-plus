import { createMiddleware } from '@tanstack/react-start'

export const requireAdmin = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const { getAuthenticatedUserByRole } = await import('./auth.server')
    const admin = await getAuthenticatedUserByRole('admin')
    return next({ context: { admin } })
  },
)
export const requireTeacher = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const { getAuthenticatedUserByRole } = await import('./auth.server')
    const teacher = await getAuthenticatedUserByRole('guru')
    return next({ context: { teacher } })
  },
)
export const requireSuperAdmin = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const { getAuthenticatedUserByRole } = await import('./auth.server')
    const superAdmin = await getAuthenticatedUserByRole('super-admin')
    return next({ context: { superAdmin } })
  },
)
