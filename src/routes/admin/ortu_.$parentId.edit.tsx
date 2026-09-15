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
  ParentForm,
  parentFormValues,
} from '#/components/admin/forms/parent-form'
import { affectsAdminData } from '#/lib/route-invalidation'
import { updateUser } from '#/server/actions'
import {
  loadTenantClasses,
  loadTenantStudents,
  loadTenantUsers,
} from '#/server/loaders'
import type { AppUser, ClassRoom, Student } from '#/server/tenant-data'

export const Route = createFileRoute('/admin/ortu_/$parentId/edit')({
  loader: async ({ params: { parentId } }) => {
    const [users, students, classes] = await Promise.all([
      loadTenantUsers(),
      loadTenantStudents(),
      loadTenantClasses(),
    ])
    const parent = users.find(
      (user) => user.id === parentId && user.role === 'ortu',
    )

    if (!parent) throw notFound()

    return { parent, students, classes }
  },
  component: EditParentRoute,
  pendingComponent: EntityFormPageSkeleton,
  notFoundComponent: () => (
    <EntityNotFoundPage
      entityLabel="Orang tua"
      backLink={<Link to="/admin/ortu" />}
    />
  ),
  staticData: { title: 'Edit Orang Tua' },
})

function EditParentRoute() {
  const { parent, students, classes } = Route.useLoaderData()

  return (
    <EditParentForm
      key={parent.id}
      parent={parent}
      students={students}
      classes={classes}
    />
  )
}

type EditParentFormProps = {
  parent: AppUser
  students: Array<Student>
  classes: Array<ClassRoom>
}

function EditParentForm({ parent, students, classes }: EditParentFormProps) {
  const navigate = Route.useNavigate()
  const router = useRouter()
  const [values, setValues] = useState(() => parentFormValues(parent))

  async function handleSubmit() {
    await updateUser({
      data: {
        id: parent.id,
        name: values.name,
        email: values.email,
        password: values.password || undefined,
        role: 'ortu',
        studentId: values.studentId === 'none' ? undefined : values.studentId,
      },
    })
    await router.invalidate({ filter: affectsAdminData })
    await navigate({ to: '/admin/ortu' })
  }

  return (
    <EntityFormPage
      title={`Edit ${parent.name}`}
      description="Perbarui akun orang tua atau ubah siswa yang ditautkan. Biarkan kata sandi kosong untuk mempertahankan kata sandi lama."
      cancelLink={<Link to="/admin/ortu" />}
      onSubmit={handleSubmit}
    >
      <ParentForm
        students={students}
        classes={classes}
        values={values}
        onChange={setValues}
        idPrefix="edit-parent"
        isEditing
      />
    </EntityFormPage>
  )
}
