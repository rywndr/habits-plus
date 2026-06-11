import { createFileRoute, redirect } from '@tanstack/react-router'
import { loadSessionRole } from '#/server/loaders'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const role = await loadSessionRole()
    if (role) throw redirect({ href: `/${role}` })
    throw redirect({ to: '/login' })
  },
})
