import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginCard } from '#/components/auth/login-card'
import { loadSessionRole } from '#/server/loaders'

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    const role = await loadSessionRole()
    if (role) throw redirect({ href: `/${role}` })
  },
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-brand-navy p-4">
      <LoginCard />
    </div>
  )
}
