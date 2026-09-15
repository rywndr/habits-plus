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
  SchoolAdminForm,
  schoolAdminFormValues,
} from '#/components/super-admin/forms/school-admin-form'
import { affectsSuperAdminData } from '#/lib/route-invalidation'
import { updateSchoolAdmin } from '#/server/actions'
import { loadSuperAdminSchoolAdmins } from '#/server/loaders'
import type { SuperAdminSchool, SuperAdminSchoolAdmin } from '#/server/loaders'

export const Route = createFileRoute(
  '/super-admin/admin-sekolah_/$adminId/edit',
)({
  loader: async ({ params: { adminId } }) => {
    const data = await loadSuperAdminSchoolAdmins()
    const admin = data.admins.find((item) => item.id === adminId)

    if (!admin) throw notFound()

    return { admin, schools: data.schools }
  },
  component: EditSchoolAdminRoute,
  pendingComponent: EntityFormPageSkeleton,
  notFoundComponent: () => (
    <EntityNotFoundPage
      entityLabel="Admin sekolah"
      backLink={<Link to="/super-admin/admin-sekolah" />}
    />
  ),
  staticData: { title: 'Edit Admin Sekolah' },
})

function EditSchoolAdminRoute() {
  const { admin, schools } = Route.useLoaderData()

  return <EditSchoolAdminForm key={admin.id} admin={admin} schools={schools} />
}

type EditSchoolAdminFormProps = {
  admin: SuperAdminSchoolAdmin
  schools: Array<SuperAdminSchool>
}

function EditSchoolAdminForm({ admin, schools }: EditSchoolAdminFormProps) {
  const navigate = Route.useNavigate()
  const router = useRouter()
  const [values, setValues] = useState(() =>
    schoolAdminFormValues({ schools, admin }),
  )

  async function handleSubmit() {
    await updateSchoolAdmin({
      data: {
        id: admin.id,
        schoolId: values.schoolId,
        name: values.name,
        email: values.email,
        password: values.password || undefined,
      },
    })
    await router.invalidate({ filter: affectsSuperAdminData })
    await navigate({ to: '/super-admin/admin-sekolah' })
  }

  return (
    <EntityFormPage
      title={`Edit ${admin.name}`}
      description="Perbarui sekolah, profil akun, atau kata sandi admin. Biarkan kata sandi kosong untuk mempertahankan kata sandi lama."
      cancelLink={<Link to="/super-admin/admin-sekolah" />}
      onSubmit={handleSubmit}
      submitDisabled={!values.schoolId}
    >
      <SchoolAdminForm
        schools={schools}
        values={values}
        onChange={setValues}
        idPrefix="edit-school-admin"
        isEditing
      />
    </EntityFormPage>
  )
}
