import { createFileRoute } from '@tanstack/react-router'
import { LoginCard } from '#/components/auth/login-card'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-brand-navy p-4">
      <LoginCard />
    </div>
  )
}
