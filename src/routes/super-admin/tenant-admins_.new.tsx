import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import {
  EntityFormPage,
  EntityFormPageSkeleton,
} from '#/components/admin/entity-form-page'
import {
  SchoolAdminForm,
  schoolAdminFormValues,
} from '#/components/super-admin/forms/school-admin-form'
import { affectsSuperAdminData } from '#/lib/route-invalidation'
import { createSchoolAdmin } from '#/server/actions'
import { loadSuperAdminSchools } from '#/server/loaders'

export const Route = createFileRoute('/super-admin/tenant-admins_/new')({
  loader: () => loadSuperAdminSchools(),
  component: NewSchoolAdminRoute,
  pendingComponent: EntityFormPageSkeleton,
  staticData: { title: 'Tambah Tenant Admin' },
})

function NewSchoolAdminRoute() {
  const schools = Route.useLoaderData()
  const navigate = Route.useNavigate()
  const router = useRouter()
  const [values, setValues] = useState(() => schoolAdminFormValues({ schools }))

  async function handleSubmit() {
    await createSchoolAdmin({ data: values })
    await router.invalidate({ filter: affectsSuperAdminData })
    await navigate({ to: '/super-admin/tenant-admins' })
  }

  return (
    <EntityFormPage
      title="Tambah Tenant Admin"
      description="Buat akun admin untuk tenant yang sudah terdaftar. Satu tenant dapat memiliki lebih dari satu admin."
      cancelLink={<Link to="/super-admin/tenant-admins" />}
      onSubmit={handleSubmit}
      submitDisabled={!values.schoolId}
    >
      <SchoolAdminForm
        schools={schools}
        values={values}
        onChange={setValues}
        idPrefix="new-school-admin"
      />
    </EntityFormPage>
  )
}
