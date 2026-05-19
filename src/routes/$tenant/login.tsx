import { createFileRoute } from '@tanstack/react-router'
import { LoginCard } from '#/components/auth/login-card'
import { loadTenant } from '#/server/loaders'

export const Route = createFileRoute('/$tenant/login')({
  loader: ({ params }) => loadTenant({ data: { tenant: params.tenant } }),
  component: LoginPage,
})

function LoginPage() {
  const { tenant } = Route.useParams()
  const tenantInfo = Route.useLoaderData()

  return (
    <div className="flex min-h-svh items-center justify-center bg-brand-navy p-4">
      <LoginCard tenant={tenant} tenantName={tenantInfo.name} />
    </div>
  )
}
