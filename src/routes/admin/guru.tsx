import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { AddEntityLink } from '#/components/admin/add-entity-link'
import { DataTable } from '#/components/admin/data-table'
import type { Column } from '#/components/admin/data-table'
import { DeleteEntityDialog } from '#/components/admin/delete-entity-dialog'
import { DataTableSkeleton } from '#/components/skeletons/data-table-skeleton'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { affectsAdminData } from '#/lib/route-invalidation'
import { deleteUser } from '#/server/actions'
import { loadTenantClasses, loadTenantUsers } from '#/server/loaders'
import type { AppUser } from '#/server/tenant-data'

export const Route = createFileRoute('/admin/guru')({
  loader: async () => {
    const [users, classes] = await Promise.all([
      loadTenantUsers(),
      loadTenantClasses(),
    ])

    return {
      teachers: users.filter((user) => user.role === 'guru'),
      classes,
    }
  },
  component: KelolaGuru,
  staleTime: 30_000,
  pendingComponent: PendingGuruTable,
  staticData: { title: 'Kelola Guru' },
})

function PendingGuruTable() {
  return <DataTableSkeleton columns={3} rows={8} />
}

function teacherClassLabel(teacher: AppUser) {
  return teacher.classNames?.join(', ') || '-'
}

const columns: Array<Column<AppUser>> = [
  { key: 'name', header: 'Nama', render: (teacher) => teacher.name },
  { key: 'email', header: 'Email', render: (teacher) => teacher.email },
  {
    key: 'classes',
    header: 'Kelas',
    render: teacherClassLabel,
    sortValue: teacherClassLabel,
  },
]

function KelolaGuru() {
  const router = useRouter()
  const data = Route.useLoaderData()
  const [deletingTeacher, setDeletingTeacher] = useState<AppUser | null>(null)

  async function handleDelete(teacher: AppUser) {
    await deleteUser({ data: { id: teacher.id } })
    await router.invalidate({ filter: affectsAdminData })
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Kelola Guru"
          className="text-2xl leading-tight sm:text-4xl"
        />
        <DataTable
          rows={data.teachers}
          columns={columns}
          filterKey="name"
          toolbar={<AddEntityLink link={<Link to="/admin/guru/new" />} />}
          editLink={(teacher) => (
            <Link
              to="/admin/guru/$teacherId/edit"
              params={{ teacherId: teacher.id }}
              aria-label={`Edit ${teacher.name}`}
            />
          )}
          onDelete={setDeletingTeacher}
        />
        <DeleteEntityDialog
          entity={deletingTeacher}
          title="Hapus guru?"
          description={(teacher) => (
            <>
              Akun {teacher?.name ?? 'guru terpilih'} akan dihapus permanen.
              Kelas yang diampu akan kembali tanpa guru.
            </>
          )}
          onClose={() => setDeletingTeacher(null)}
          onDelete={handleDelete}
        />
      </div>
    </ContentPanel>
  )
}
