import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { DataTable } from '#/components/admin/data-table'
import type { Column } from '#/components/admin/data-table'
import { AddEntityDialog } from '#/components/admin/add-entity-dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Button } from '#/components/ui/button'
import { addClass, deleteClass } from '#/server/actions'
import { loadTenantClasses, loadTenantUsers } from '#/server/loaders'
import type { AppUser, ClassRoom } from '#/server/tenant-data'

export const Route = createFileRoute('/admin/kelas')({
  loader: async () => {
    const [classes, users] = await Promise.all([
      loadTenantClasses({ data: {} }),
      loadTenantUsers({ data: {} }),
    ])

    return { classes, users }
  },
  component: KelolaKelas,
  staticData: { title: 'Kelola Kelas' },
})

function teacherNameOf(id: string | null, users: Array<AppUser>): string {
  return users.find((u) => u.id === id)?.name ?? '-'
}

function columns(users: Array<AppUser>): Array<Column<ClassRoom>> {
  return [
    { key: 'name', header: 'Nama Kelas', render: (r) => r.name },
    {
      key: 'teacher',
      header: 'Guru',
      render: (r) => teacherNameOf(r.teacherId, users),
    },
    {
      key: 'count',
      header: 'Jumlah Siswa',
      render: (r) => r.studentCount,
      className: 'text-center',
    },
  ]
}

function KelolaKelas() {
  const router = useRouter()
  const data = Route.useLoaderData()
  const [name, setName] = useState('')

  async function handleAdd() {
    await addClass({ data: { name } })
    setName('')
    await router.invalidate()
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader title="Kelola Kelas" />
        <DataTable
          rows={data.classes}
          columns={columns(data.users)}
          filterKey="name"
          toolbar={
            <AddEntityDialog title="Tambah Kelas">
              <div className="flex flex-col gap-2">
                <Label htmlFor="k-name">Nama Kelas</Label>
                <Input
                  id="k-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="VII A"
                />
              </div>
              <Button className="self-end" onClick={handleAdd}>
                Simpan
              </Button>
            </AddEntityDialog>
          }
          onEdit={() => undefined}
          onDelete={(row) =>
            void deleteClass({ data: { id: row.id } }).then(() =>
              router.invalidate(),
            )
          }
        />
      </div>
    </ContentPanel>
  )
}
