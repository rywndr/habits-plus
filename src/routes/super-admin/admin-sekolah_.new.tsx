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

export const Route = createFileRoute('/super-admin/admin-sekolah_/new')({
  loader: () => loadSuperAdminSchools(),
  component: NewSchoolAdminRoute,
  pendingComponent: EntityFormPageSkeleton,
  staticData: { title: 'Tambah Admin Sekolah' },
})

function NewSchoolAdminRoute() {
  const schools = Route.useLoaderData()
  const navigate = Route.useNavigate()
  const router = useRouter()
  const [values, setValues] = useState(() => schoolAdminFormValues({ schools }))

  async function handleSubmit() {
    await createSchoolAdmin({ data: values })
    await router.invalidate({ filter: affectsSuperAdminData })
    await navigate({ to: '/super-admin/admin-sekolah' })
  }

  return (
    <EntityFormPage
      title="Tambah Admin Sekolah"
      description="Buat akun admin untuk sekolah yang sudah terdaftar. Satu sekolah dapat memiliki lebih dari satu admin."
      cancelLink={<Link to="/super-admin/admin-sekolah" />}
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
