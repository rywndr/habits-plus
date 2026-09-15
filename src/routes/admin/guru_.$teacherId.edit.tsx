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
  TeacherForm,
  teacherFormValues,
} from '#/components/admin/forms/teacher-form'
import { affectsAdminData } from '#/lib/route-invalidation'
import { updateUser } from '#/server/actions'
import { loadTenantClasses, loadTenantUsers } from '#/server/loaders'
import type { AppUser, ClassRoom } from '#/server/tenant-data'

export const Route = createFileRoute('/admin/guru_/$teacherId/edit')({
  loader: async ({ params: { teacherId } }) => {
    const [users, classes] = await Promise.all([
      loadTenantUsers(),
      loadTenantClasses(),
    ])
    const teacher = users.find(
      (user) => user.id === teacherId && user.role === 'guru',
    )

    if (!teacher) throw notFound()

    return { teacher, classes }
  },
  component: EditTeacherRoute,
  pendingComponent: EntityFormPageSkeleton,
  notFoundComponent: () => (
    <EntityNotFoundPage
      entityLabel="Guru"
      backLink={<Link to="/admin/guru" />}
    />
  ),
  staticData: { title: 'Edit Guru' },
})

function EditTeacherRoute() {
  const { teacher, classes } = Route.useLoaderData()

  return (
    <EditTeacherForm key={teacher.id} teacher={teacher} classes={classes} />
  )
}

type EditTeacherFormProps = {
  teacher: AppUser
  classes: Array<ClassRoom>
}

function EditTeacherForm({ teacher, classes }: EditTeacherFormProps) {
  const navigate = Route.useNavigate()
  const router = useRouter()
  const [values, setValues] = useState(() => teacherFormValues(teacher))

  async function handleSubmit() {
    await updateUser({
      data: {
        id: teacher.id,
        name: values.name,
        email: values.email,
        password: values.password || undefined,
        role: 'guru',
        classIds: values.classIds,
      },
    })
    await router.invalidate({ filter: affectsAdminData })
    await navigate({ to: '/admin/guru' })
  }

  return (
    <EntityFormPage
      title={`Edit ${teacher.name}`}
      description="Perbarui profil guru, kata sandi, atau kelas yang diampu. Biarkan kata sandi kosong untuk mempertahankan kata sandi lama."
      cancelLink={<Link to="/admin/guru" />}
      onSubmit={handleSubmit}
    >
      <TeacherForm
        classes={classes}
        values={values}
        onChange={setValues}
        idPrefix="edit-teacher"
        isEditing
      />
    </EntityFormPage>
  )
}
