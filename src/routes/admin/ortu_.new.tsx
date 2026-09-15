import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import {
  EntityFormPage,
  EntityFormPageSkeleton,
} from '#/components/admin/entity-form-page'
import {
  ParentForm,
  parentFormValues,
} from '#/components/admin/forms/parent-form'
import { affectsAdminData } from '#/lib/route-invalidation'
import { addUser } from '#/server/actions'
import { loadTenantClasses, loadTenantStudents } from '#/server/loaders'

export const Route = createFileRoute('/admin/ortu_/new')({
  loader: async () => {
    const [students, classes] = await Promise.all([
      loadTenantStudents(),
      loadTenantClasses(),
    ])
    return { students, classes }
  },
  component: NewParentRoute,
  pendingComponent: EntityFormPageSkeleton,
  staticData: { title: 'Tambah Orang Tua' },
})

function NewParentRoute() {
  const { students, classes } = Route.useLoaderData()
  const navigate = Route.useNavigate()
  const router = useRouter()
  const [values, setValues] = useState(() => parentFormValues())

  async function handleSubmit() {
    await addUser({
      data: {
        name: values.name,
        email: values.email,
        password: values.password,
        role: 'ortu',
        studentId: values.studentId === 'none' ? undefined : values.studentId,
      },
    })
    await router.invalidate({ filter: affectsAdminData })
    await navigate({ to: '/admin/ortu' })
  }

  return (
    <EntityFormPage
      title="Tambah Orang Tua"
      description="Buat akun orang tua dan, bila tersedia, tautkan langsung ke seorang siswa."
      cancelLink={<Link to="/admin/ortu" />}
      onSubmit={handleSubmit}
    >
      <ParentForm
        students={students}
        classes={classes}
        values={values}
        onChange={setValues}
        idPrefix="new-parent"
      />
    </EntityFormPage>
  )
}
