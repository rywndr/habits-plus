import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import {
  EntityFormPage,
  EntityFormPageSkeleton,
} from '#/components/admin/entity-form-page'
import {
  StudentForm,
  studentFormValues,
} from '#/components/admin/forms/student-form'
import { affectsAdminData } from '#/lib/route-invalidation'
import { addStudent } from '#/server/actions'
import { loadTenantClasses } from '#/server/loaders'

export const Route = createFileRoute('/admin/siswa_/new')({
  loader: () => loadTenantClasses(),
  component: NewStudentRoute,
  pendingComponent: EntityFormPageSkeleton,
  staticData: { title: 'Tambah Siswa' },
})

function NewStudentRoute() {
  const classes = Route.useLoaderData()
  const navigate = Route.useNavigate()
  const router = useRouter()
  const [values, setValues] = useState(() => studentFormValues(classes))

  async function handleSubmit() {
    await addStudent({ data: values })
    await router.invalidate({ filter: affectsAdminData })
    await navigate({ to: '/admin/siswa' })
  }

  return (
    <EntityFormPage
      title="Tambah Siswa"
      description="Masukkan identitas siswa dan pilih kelas aktifnya. Kelas harus dibuat lebih dulu."
      cancelLink={<Link to="/admin/siswa" />}
      onSubmit={handleSubmit}
      submitDisabled={!values.classId}
    >
      <StudentForm
        classes={classes}
        values={values}
        onChange={setValues}
        idPrefix="new-student"
      />
    </EntityFormPage>
  )
}
