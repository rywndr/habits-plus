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
import { deleteClass } from '#/server/actions'
import { loadTenantClasses, loadTenantUsers } from '#/server/loaders'
import type { AppUser, ClassRoom } from '#/server/tenant-data'

export const Route = createFileRoute('/admin/kelas')({
  loader: async () => {
    const [classes, users] = await Promise.all([
      loadTenantClasses(),
      loadTenantUsers(),
    ])

    return { classes, users }
  },
  component: KelolaKelas,
  staleTime: 30_000,
  pendingComponent: PendingKelasTable,
  staticData: { title: 'Kelola Kelas' },
})

function PendingKelasTable() {
  return <DataTableSkeleton columns={3} rows={6} />
}

function teacherNameOf(id: string | null, users: Array<AppUser>): string {
  return users.find((user) => user.id === id)?.name ?? '-'
}

function columns(users: Array<AppUser>): Array<Column<ClassRoom>> {
  return [
    { key: 'name', header: 'Nama Kelas', render: (klass) => klass.name },
    {
      key: 'teacher',
      header: 'Guru',
      render: (klass) => teacherNameOf(klass.teacherId, users),
      sortValue: (klass) => teacherNameOf(klass.teacherId, users),
    },
    {
      key: 'count',
      header: 'Jumlah Siswa',
      render: (klass) => klass.studentCount,
      sortValue: (klass) => klass.studentCount,
      className: 'text-center',
    },
  ]
}

function KelolaKelas() {
  const router = useRouter()
  const data = Route.useLoaderData()
  const [deletingClass, setDeletingClass] = useState<ClassRoom | null>(null)

  async function handleDelete(klass: ClassRoom) {
    await deleteClass({ data: { id: klass.id } })
    await router.invalidate({ filter: affectsAdminData })
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Kelola Kelas"
          className="text-2xl leading-tight sm:text-4xl"
        />
        <DataTable
          rows={data.classes}
          columns={columns(data.users)}
          filterKey="name"
          toolbar={<AddEntityLink link={<Link to="/admin/kelas/new" />} />}
          editLink={(klass) => (
            <Link
              to="/admin/kelas/$classId/edit"
              params={{ classId: klass.id }}
              aria-label={`Edit ${klass.name}`}
            />
          )}
          onDelete={setDeletingClass}
        />
        <DeleteEntityDialog
          entity={deletingClass}
          title="Hapus kelas?"
          description={(klass) => (
            <>
              Kelas {klass?.name ?? 'terpilih'} akan dihapus permanen. Kelas
              yang masih memiliki siswa tidak dapat dihapus.
            </>
          )}
          onClose={() => setDeletingClass(null)}
          onDelete={handleDelete}
        />
      </div>
    </ContentPanel>
  )
}
