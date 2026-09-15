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
import { ClassForm, classFormValues } from '#/components/admin/forms/class-form'
import { affectsAdminData } from '#/lib/route-invalidation'
import { updateClass } from '#/server/actions'
import { loadTenantClasses, loadTenantUsers } from '#/server/loaders'
import type { AppUser, ClassRoom } from '#/server/tenant-data'

export const Route = createFileRoute('/admin/kelas_/$classId/edit')({
  loader: async ({ params: { classId } }) => {
    const [classes, users] = await Promise.all([
      loadTenantClasses(),
      loadTenantUsers(),
    ])
    const klass = classes.find((item) => item.id === classId)

    if (!klass) throw notFound()

    return {
      klass,
      teachers: users.filter((user) => user.role === 'guru'),
    }
  },
  component: EditClassRoute,
  pendingComponent: EntityFormPageSkeleton,
  notFoundComponent: () => (
    <EntityNotFoundPage
      entityLabel="Kelas"
      backLink={<Link to="/admin/kelas" />}
    />
  ),
  staticData: { title: 'Edit Kelas' },
})

function EditClassRoute() {
  const { klass, teachers } = Route.useLoaderData()

  return <EditClassForm key={klass.id} klass={klass} teachers={teachers} />
}

type EditClassFormProps = {
  klass: ClassRoom
  teachers: Array<AppUser>
}

function EditClassForm({ klass, teachers }: EditClassFormProps) {
  const navigate = Route.useNavigate()
  const router = useRouter()
  const [values, setValues] = useState(() => classFormValues(klass))

  async function handleSubmit() {
    await updateClass({
      data: {
        id: klass.id,
        name: values.name,
        teacherId: values.teacherId === 'none' ? undefined : values.teacherId,
      },
    })
    await router.invalidate({ filter: affectsAdminData })
    await navigate({ to: '/admin/kelas' })
  }

  return (
    <EntityFormPage
      title={`Edit ${klass.name}`}
      description="Ubah nama kelas atau guru yang ditugaskan. Siswa di kelas ini tidak ikut berubah."
      cancelLink={<Link to="/admin/kelas" />}
      onSubmit={handleSubmit}
    >
      <ClassForm
        teachers={teachers}
        values={values}
        onChange={setValues}
        idPrefix="edit-class"
      />
    </EntityFormPage>
  )
}
