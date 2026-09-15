import { useMemo, useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { AddEntityLink } from '#/components/admin/add-entity-link'
import { DataTable } from '#/components/admin/data-table'
import type { Column } from '#/components/admin/data-table'
import { DeleteEntityDialog } from '#/components/admin/delete-entity-dialog'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { affectsSuperAdminData } from '#/lib/route-invalidation'
import { deleteSchool } from '#/server/actions'
import type { SuperAdminSchool } from '#/server/loaders'

type SchoolsPageProps = {
  schools: Array<SuperAdminSchool>
}

function schoolColumns(): Array<Column<SuperAdminSchool>> {
  return [
    { key: 'name', header: 'Nama Sekolah', render: (school) => school.name },
    { key: 'region', header: 'Wilayah', render: (school) => school.region },
    {
      key: 'adminCount',
      header: 'Admin',
      render: (school) => school.adminCount,
      sortValue: (school) => school.adminCount,
      className: 'text-center',
    },
  ]
}

export function SchoolsPage({ schools }: SchoolsPageProps) {
  const router = useRouter()
  const [deletingSchool, setDeletingSchool] = useState<SuperAdminSchool | null>(
    null,
  )
  const columns = useMemo(() => schoolColumns(), [])

  async function handleDelete(school: SuperAdminSchool) {
    await deleteSchool({ data: { id: school.id } })
    await router.invalidate({ filter: affectsSuperAdminData })
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Sekolah"
          className="text-2xl leading-tight sm:text-4xl"
        />
        <DataTable
          rows={schools}
          columns={columns}
          filterKey="name"
          toolbar={
            <AddEntityLink
              link={<Link to="/super-admin/new" />}
              label="Tambah sekolah"
            />
          }
          editLink={(school) => (
            <Link
              to="/super-admin/$schoolId/edit"
              params={{ schoolId: school.id }}
              aria-label={`Edit ${school.name}`}
            />
          )}
          onDelete={setDeletingSchool}
        />
        <DeleteEntityDialog
          entity={deletingSchool}
          title="Hapus sekolah?"
          description={(school) => (
            <>Data sekolah {school?.name} akan dihapus dari sistem.</>
          )}
          onClose={() => setDeletingSchool(null)}
          onDelete={handleDelete}
        />
      </div>
    </ContentPanel>
  )
}
