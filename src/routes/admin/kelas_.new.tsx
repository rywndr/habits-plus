import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import {
  EntityFormPage,
  EntityFormPageSkeleton,
} from '#/components/admin/entity-form-page'
import { ClassForm, classFormValues } from '#/components/admin/forms/class-form'
import { affectsAdminData } from '#/lib/route-invalidation'
import { addClass } from '#/server/actions'
import { loadTenantUsers } from '#/server/loaders'

export const Route = createFileRoute('/admin/kelas_/new')({
  loader: async () => {
    const users = await loadTenantUsers()
    return users.filter((user) => user.role === 'guru')
  },
  component: NewClassRoute,
  pendingComponent: EntityFormPageSkeleton,
  staticData: { title: 'Tambah Kelas' },
})

function NewClassRoute() {
  const teachers = Route.useLoaderData()
  const navigate = Route.useNavigate()
  const router = useRouter()
  const [values, setValues] = useState(() => classFormValues())

  async function handleSubmit() {
    await addClass({
      data: {
        name: values.name,
        teacherId: values.teacherId === 'none' ? undefined : values.teacherId,
      },
    })
    await router.invalidate({ filter: affectsAdminData })
    await navigate({ to: '/admin/kelas' })
  }

  return (
    <EntityFormPage
      title="Tambah Kelas"
      description="Tambahkan kelas baru. Guru dapat ditugaskan sekarang atau setelah kelas dibuat."
      cancelLink={<Link to="/admin/kelas" />}
      onSubmit={handleSubmit}
    >
      <ClassForm
        teachers={teachers}
        values={values}
        onChange={setValues}
        idPrefix="new-class"
      />
    </EntityFormPage>
  )
}
