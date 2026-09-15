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
  StudentForm,
  studentFormValues,
} from '#/components/admin/forms/student-form'
import { affectsAdminData } from '#/lib/route-invalidation'
import { updateStudent } from '#/server/actions'
import { loadTenantClasses, loadTenantStudents } from '#/server/loaders'
import type { ClassRoom, Student } from '#/server/tenant-data'

export const Route = createFileRoute('/admin/siswa_/$studentId/edit')({
  loader: async ({ params: { studentId } }) => {
    const [students, classes] = await Promise.all([
      loadTenantStudents(),
      loadTenantClasses(),
    ])
    const student = students.find((item) => item.id === studentId)

    if (!student) throw notFound()

    return { student, classes }
  },
  component: EditStudentRoute,
  pendingComponent: EntityFormPageSkeleton,
  notFoundComponent: () => (
    <EntityNotFoundPage
      entityLabel="Siswa"
      backLink={<Link to="/admin/siswa" />}
    />
  ),
  staticData: { title: 'Edit Siswa' },
})

function EditStudentRoute() {
  const { student, classes } = Route.useLoaderData()

  return (
    <EditStudentForm key={student.id} student={student} classes={classes} />
  )
}

type EditStudentFormProps = {
  student: Student
  classes: Array<ClassRoom>
}

function EditStudentForm({ student, classes }: EditStudentFormProps) {
  const navigate = Route.useNavigate()
  const router = useRouter()
  const [values, setValues] = useState(() =>
    studentFormValues(classes, student),
  )

  async function handleSubmit() {
    await updateStudent({ data: { id: student.id, ...values } })
    await router.invalidate({ filter: affectsAdminData })
    await navigate({ to: '/admin/siswa' })
  }

  return (
    <EntityFormPage
      title={`Edit ${student.name}`}
      description="Perbarui NISN, nama, kelas aktif, atau jenis kelamin siswa."
      cancelLink={<Link to="/admin/siswa" />}
      onSubmit={handleSubmit}
      submitDisabled={!values.classId}
    >
      <StudentForm
        classes={classes}
        values={values}
        onChange={setValues}
        idPrefix="edit-student"
      />
    </EntityFormPage>
  )
}
