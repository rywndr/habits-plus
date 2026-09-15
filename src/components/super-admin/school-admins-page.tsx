import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { AddEntityLink } from '#/components/admin/add-entity-link'
import { DataTable } from '#/components/admin/data-table'
import type { Column } from '#/components/admin/data-table'
import { DeleteEntityDialog } from '#/components/admin/delete-entity-dialog'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '#/components/ui/select'
import { affectsSuperAdminData } from '#/lib/route-invalidation'
import { deleteSchoolAdmin } from '#/server/actions'
import type { SuperAdminSchool, SuperAdminSchoolAdmin } from '#/server/loaders'

type SchoolAdminsPageProps = {
  schools: Array<SuperAdminSchool>
  admins: Array<SuperAdminSchoolAdmin>
}

const columns: Array<Column<SuperAdminSchoolAdmin>> = [
  { key: 'name', header: 'Nama Admin', render: (admin) => admin.name },
  { key: 'email', header: 'Email', render: (admin) => admin.email },
  {
    key: 'schoolName',
    header: 'Sekolah',
    render: (admin) => admin.schoolName,
    sortValue: (admin) => admin.schoolName,
  },
]

export function SchoolAdminsPage({ schools, admins }: SchoolAdminsPageProps) {
  const router = useRouter()
  const [filterSchoolId, setFilterSchoolId] = useState('all')
  const [deletingAdmin, setDeletingAdmin] =
    useState<SuperAdminSchoolAdmin | null>(null)
  const filteredAdmins =
    filterSchoolId === 'all'
      ? admins
      : admins.filter((admin) => admin.schoolId === filterSchoolId)

  async function handleDelete(admin: SuperAdminSchoolAdmin) {
    await deleteSchoolAdmin({ data: { id: admin.id } })
    await router.invalidate({ filter: affectsSuperAdminData })
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Admin Sekolah"
          className="text-2xl leading-tight sm:text-4xl"
        />
        <DataTable
          rows={filteredAdmins}
          columns={columns}
          filterKey="name"
          toolbar={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <SchoolFilter
                schools={schools}
                value={filterSchoolId}
                onChange={setFilterSchoolId}
              />
              <AddEntityLink
                link={<Link to="/super-admin/admin-sekolah/new" />}
                label="Tambah admin"
              />
            </div>
          }
          editLink={(admin) => (
            <Link
              to="/super-admin/admin-sekolah/$adminId/edit"
              params={{ adminId: admin.id }}
              aria-label={`Edit ${admin.name}`}
            />
          )}
          onDelete={setDeletingAdmin}
        />
        <DeleteEntityDialog
          entity={deletingAdmin}
          title="Hapus admin sekolah?"
          description={(admin) => (
            <>
              Akun {admin?.name} untuk {admin?.schoolName} akan dihapus.
            </>
          )}
          onClose={() => setDeletingAdmin(null)}
          onDelete={handleDelete}
        />
      </div>
    </ContentPanel>
  )
}

type SchoolFilterProps = {
  schools: Array<SuperAdminSchool>
  value: string
  onChange: (value: string) => void
}

function SchoolFilter({ schools, value, onChange }: SchoolFilterProps) {
  const selectedSchool = schools.find((school) => school.id === value)

  return (
    <Select
      value={value}
      onValueChange={(schoolId) => {
        if (schoolId) onChange(schoolId)
      }}
    >
      <SelectTrigger className="w-full bg-card sm:w-64">
        <span className="min-w-0 flex-1 truncate text-left">
          {value === 'all' ? 'Semua sekolah' : selectedSchool?.name}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Semua sekolah</SelectItem>
        {schools.map((school) => (
          <SelectItem key={school.id} value={school.id}>
            {school.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
