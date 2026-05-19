import { createFileRoute } from '@tanstack/react-router'
import { LoginCard } from '#/components/auth/login-card'
import { getTenantBySlug } from '#/data'

export const Route = createFileRoute('/$tenant/login')({ component: LoginPage })

function LoginPage() {
  const { tenant } = Route.useParams()
  const tenantInfo = getTenantBySlug(tenant)

  return (
    <div className="flex min-h-svh items-center justify-center bg-brand-navy p-4">
      <LoginCard tenant={tenant} tenantName={tenantInfo.name} />
    </div>
  )
}
