import { useMemo, useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { AddEntityLink } from '#/components/admin/add-entity-link'
import { DataTable } from '#/components/admin/data-table'
import type { Column } from '#/components/admin/data-table'
import { DeleteEntityDialog } from '#/components/admin/delete-entity-dialog'
import { ALL_CLASSES, ClassSelect } from '#/components/guru/class-select'
import { DataTableSkeleton } from '#/components/skeletons/data-table-skeleton'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { affectsAdminData } from '#/lib/route-invalidation'
import { deleteStudent } from '#/server/actions'
import { loadTenantClasses, loadTenantStudents } from '#/server/loaders'
import type { ClassRoom, Student } from '#/server/tenant-data'

export const Route = createFileRoute('/admin/siswa')({
  loader: async () => {
    const [classes, students] = await Promise.all([
      loadTenantClasses(),
      loadTenantStudents(),
    ])

    return { classes, students }
  },
  component: KelolaSiswa,
  staleTime: 30_000,
  pendingComponent: PendingSiswaTable,
  staticData: { title: 'Kelola Siswa' },
})

function PendingSiswaTable() {
  return <DataTableSkeleton columns={4} rows={10} />
}

function classNameOf(id: string, classes: Array<ClassRoom>): string {
  return classes.find((klass) => klass.id === id)?.name ?? '-'
}

function columns(classes: Array<ClassRoom>): Array<Column<Student>> {
  return [
    { key: 'nisn', header: 'NISN', render: (student) => student.nisn },
    { key: 'name', header: 'Nama', render: (student) => student.name },
    {
      key: 'gender',
      header: 'L/P',
      render: (student) => student.gender,
      className: 'text-center',
    },
    {
      key: 'class',
      header: 'Kelas',
      render: (student) => classNameOf(student.classId, classes),
      sortValue: (student) => classNameOf(student.classId, classes),
    },
  ]
}

function KelolaSiswa() {
  const router = useRouter()
  const data = Route.useLoaderData()
  const [classFilter, setClassFilter] = useState(ALL_CLASSES)
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null)
  const filteredStudents = useMemo(
    () =>
      classFilter === ALL_CLASSES
        ? data.students
        : data.students.filter((student) => student.classId === classFilter),
    [classFilter, data.students],
  )

  async function handleDelete(student: Student) {
    await deleteStudent({ data: { id: student.id } })
    await router.invalidate({ filter: affectsAdminData })
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Kelola Siswa"
          className="text-2xl leading-tight sm:text-4xl"
        />
        <DataTable
          rows={filteredStudents}
          columns={columns(data.classes)}
          filterKey="name"
          toolbar={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <ClassSelect
                classes={data.classes}
                value={classFilter}
                onChange={setClassFilter}
                includeAll
              />
              <AddEntityLink link={<Link to="/admin/siswa/new" />} />
            </div>
          }
          editLink={(student) => (
            <Link
              to="/admin/siswa/$studentId/edit"
              params={{ studentId: student.id }}
              aria-label={`Edit ${student.name}`}
            />
          )}
          onDelete={setDeletingStudent}
        />
        <DeleteEntityDialog
          entity={deletingStudent}
          title="Hapus siswa?"
          description={(student) => (
            <>Data {student?.name ?? 'siswa terpilih'} akan dihapus permanen.</>
          )}
          onClose={() => setDeletingStudent(null)}
          onDelete={handleDelete}
        />
      </div>
    </ContentPanel>
  )
}
