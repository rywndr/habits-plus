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
import { deleteUser } from '#/server/actions'
import {
  loadTenantClasses,
  loadTenantStudents,
  loadTenantUsers,
} from '#/server/loaders'
import type { AppUser, Student } from '#/server/tenant-data'

export const Route = createFileRoute('/admin/ortu')({
  loader: async () => {
    const [users, students, classes] = await Promise.all([
      loadTenantUsers(),
      loadTenantStudents(),
      loadTenantClasses(),
    ])

    return {
      parents: users.filter((user) => user.role === 'ortu'),
      students,
      classes,
    }
  },
  component: KelolaOrtu,
  staleTime: 30_000,
  pendingComponent: PendingOrtuTable,
  staticData: { title: 'Kelola Orang Tua' },
})

function PendingOrtuTable() {
  return <DataTableSkeleton columns={3} rows={8} />
}

function childNameOf(parentId: string, students: Array<Student>): string {
  return students.find((student) => student.parentId === parentId)?.name ?? '-'
}

function columns(students: Array<Student>): Array<Column<AppUser>> {
  return [
    { key: 'name', header: 'Nama', render: (parent) => parent.name },
    { key: 'email', header: 'Email', render: (parent) => parent.email },
    {
      key: 'child',
      header: 'Anak',
      render: (parent) => childNameOf(parent.id, students),
      sortValue: (parent) => childNameOf(parent.id, students),
    },
  ]
}

function KelolaOrtu() {
  const router = useRouter()
  const { parents, students, classes } = Route.useLoaderData()
  const [classFilter, setClassFilter] = useState(ALL_CLASSES)
  const [deletingParent, setDeletingParent] = useState<AppUser | null>(null)
  const filteredParents = useMemo(
    () =>
      classFilter === ALL_CLASSES
        ? parents
        : parents.filter((parent) => {
            const child = students.find(
              (student) => student.parentId === parent.id,
            )

            return child?.classId === classFilter
          }),
    [classFilter, parents, students],
  )

  async function handleDelete(parent: AppUser) {
    await deleteUser({ data: { id: parent.id } })
    await router.invalidate({ filter: affectsAdminData })
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader
          title="Kelola Orang Tua"
          className="text-2xl leading-tight sm:text-4xl"
        />
        <DataTable
          rows={filteredParents}
          columns={columns(students)}
          filterKey="name"
          toolbar={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <ClassSelect
                classes={classes}
                value={classFilter}
                onChange={setClassFilter}
                includeAll
              />
              <AddEntityLink link={<Link to="/admin/ortu/new" />} />
            </div>
          }
          editLink={(parent) => (
            <Link
              to="/admin/ortu/$parentId/edit"
              params={{ parentId: parent.id }}
              aria-label={`Edit ${parent.name}`}
            />
          )}
          onDelete={setDeletingParent}
        />
        <DeleteEntityDialog
          entity={deletingParent}
          title="Hapus orang tua?"
          description={(parent) => (
            <>
              Akun {parent?.name ?? 'orang tua terpilih'} akan dihapus permanen.
              Siswa yang tertaut akan kembali tanpa akun orang tua.
            </>
          )}
          onClose={() => setDeletingParent(null)}
          onDelete={handleDelete}
        />
      </div>
    </ContentPanel>
  )
}
