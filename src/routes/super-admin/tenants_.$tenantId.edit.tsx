import { useState } from 'react'
import {
  Link,
  createFileRoute,
  notFound,
  useRouter,
} from '@tanstack/react-router'
import {
  EntityFormPage,
  EntityFormPageSkeleton,
  EntityNotFoundPage,
} from '#/components/admin/entity-form-page'
import {
  SchoolForm,
  schoolFormValues,
} from '#/components/super-admin/forms/school-form'
import { affectsSuperAdminData } from '#/lib/route-invalidation'
import { updateSchool } from '#/server/actions'
import { loadSuperAdminSchools } from '#/server/loaders'
import type { SuperAdminSchool } from '#/server/loaders'

export const Route = createFileRoute('/super-admin/tenants_/$tenantId/edit')({
  loader: async ({ params: { tenantId } }) => {
    const schools = await loadSuperAdminSchools()
    const school = schools.find((item) => item.id === tenantId)

    if (!school) throw notFound()

    return school
  },
  component: EditSchoolRoute,
  pendingComponent: EntityFormPageSkeleton,
  notFoundComponent: () => (
    <EntityNotFoundPage
      entityLabel="Tenant"
      backLink={<Link to="/super-admin/tenants" />}
    />
  ),
  staticData: { title: 'Edit Tenant' },
})

function EditSchoolRoute() {
  const school = Route.useLoaderData()
  return <EditSchoolForm key={school.id} school={school} />
}

function EditSchoolForm({ school }: { school: SuperAdminSchool }) {
  const navigate = Route.useNavigate()
  const router = useRouter()
  const [values, setValues] = useState(() => schoolFormValues(school))

  async function handleSubmit() {
    await updateSchool({ data: { id: school.id, ...values } })
    await router.invalidate({ filter: affectsSuperAdminData })
    await navigate({ to: '/super-admin/tenants' })
  }

  return (
    <EntityFormPage
      title={`Edit ${school.name}`}
      description="Perbarui nama tenant atau wilayahnya. Slug tenant tetap sama agar tautan yang ada tidak berubah."
      cancelLink={<Link to="/super-admin/tenants" />}
      onSubmit={handleSubmit}
    >
      <SchoolForm values={values} onChange={setValues} idPrefix="edit-school" />
    </EntityFormPage>
  )
}
