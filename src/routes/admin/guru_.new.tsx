import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import {
  EntityFormPage,
  EntityFormPageSkeleton,
} from '#/components/admin/entity-form-page'
import {
  TeacherForm,
  teacherFormValues,
} from '#/components/admin/forms/teacher-form'
import { affectsAdminData } from '#/lib/route-invalidation'
import { addUser } from '#/server/actions'
import { loadTenantClasses } from '#/server/loaders'

export const Route = createFileRoute('/admin/guru_/new')({
  loader: () => loadTenantClasses(),
  component: NewTeacherRoute,
  pendingComponent: EntityFormPageSkeleton,
  staticData: { title: 'Tambah Guru' },
})

function NewTeacherRoute() {
  const classes = Route.useLoaderData()
  const navigate = Route.useNavigate()
  const router = useRouter()
  const [values, setValues] = useState(() => teacherFormValues())

  async function handleSubmit() {
    await addUser({ data: { ...values, role: 'guru' } })
    await router.invalidate({ filter: affectsAdminData })
    await navigate({ to: '/admin/guru' })
  }

  return (
    <EntityFormPage
      title="Tambah Guru"
      description="Buat akun guru dan tentukan kelas yang diampu. Penugasan kelas dapat diubah lagi nanti."
      cancelLink={<Link to="/admin/guru" />}
      onSubmit={handleSubmit}
    >
      <TeacherForm
        classes={classes}
        values={values}
        onChange={setValues}
        idPrefix="new-teacher"
      />
    </EntityFormPage>
  )
}
