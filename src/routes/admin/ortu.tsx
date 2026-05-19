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
import { addUser, deleteUser } from '#/server/actions'
import { loadTenantStudents, loadTenantUsers } from '#/server/loaders'
import type { AppUser, Student } from '#/server/tenant-data'

export const Route = createFileRoute('/admin/ortu')({
  loader: async () => {
    const [users, students] = await Promise.all([
      loadTenantUsers({ data: {} }),
      loadTenantStudents({ data: {} }),
    ])

    return {
      parents: users.filter((user) => user.role === 'ortu'),
      students,
    }
  },
  component: KelolaOrtu,
  staticData: { title: 'Kelola Orang Tua' },
})

function childNameOf(parentId: string, students: Array<Student>): string {
  const student = students.find((s) => s.parentId === parentId)
  return student?.name ?? '-'
}

function columns(students: Array<Student>): Array<Column<AppUser>> {
  return [
    { key: 'name', header: 'Nama', render: (r) => r.name },
    { key: 'email', header: 'Email', render: (r) => r.email },
    {
      key: 'child',
      header: 'Anak',
      render: (r) => childNameOf(r.id, students),
    },
  ]
}

function KelolaOrtu() {
  const router = useRouter()
  const { parents, students } = Route.useLoaderData()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleAdd() {
    await addUser({ data: { name, email, password, role: 'ortu' } })
    setName('')
    setEmail('')
    setPassword('')
    await router.invalidate()
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader title="Kelola Orang Tua" />
        <DataTable
          rows={parents}
          columns={columns(students)}
          filterKey="name"
          toolbar={
            <AddEntityDialog title="Tambah Orang Tua">
              <div className="flex flex-col gap-2">
                <Label htmlFor="o-name">Nama</Label>
                <Input
                  id="o-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Nama lengkap"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="o-email">Email</Label>
                <Input
                  id="o-email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  placeholder="email@contoh.id"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="o-password">Kata Sandi Awal</Label>
                <Input
                  id="o-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  placeholder="Minimal 8 karakter"
                />
              </div>
              <Button className="self-end" onClick={handleAdd}>
                Simpan
              </Button>
            </AddEntityDialog>
          }
          onEdit={() => undefined}
          onDelete={(row) =>
            void deleteUser({ data: { id: row.id } }).then(() =>
              router.invalidate(),
            )
          }
        />
      </div>
    </ContentPanel>
  )
}
