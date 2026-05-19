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
import { loadTenantUsers } from '#/server/loaders'
import type { AppUser } from '#/server/tenant-data'

export const Route = createFileRoute('/$tenant/admin/guru')({
  loader: ({ params }) =>
    loadTenantUsers({ data: { tenant: params.tenant } }).then((users) =>
      users.filter((user) => user.role === 'guru'),
    ),
  component: KelolaGuru,
  staticData: { title: 'Kelola Guru' },
})

const columns: Array<Column<AppUser>> = [
  { key: 'name', header: 'Nama', render: (r) => r.name },
  { key: 'email', header: 'Email', render: (r) => r.email },
  { key: 'tenant', header: 'Sekolah', render: (r) => r.tenantSlug },
]

function KelolaGuru() {
  const router = useRouter()
  const { tenant } = Route.useParams()
  const teachers = Route.useLoaderData()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  async function handleAdd() {
    await addUser({ data: { tenant, name, email, password, role: 'guru' } })
    setName('')
    setEmail('')
    setPassword('')
    await router.invalidate()
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader title="Kelola Guru" />
        <DataTable
          rows={teachers}
          columns={columns}
          filterKey="name"
          toolbar={
            <AddEntityDialog
              title="Tambah Guru"
              description="Isi data guru baru."
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="g-name">Nama</Label>
                <Input
                  id="g-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Nama lengkap"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="g-email">Email</Label>
                <Input
                  id="g-email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  placeholder="nama@sekolah.id"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="g-password">Kata Sandi Awal</Label>
                <Input
                  id="g-password"
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
            void deleteUser({ data: { tenant, id: row.id } }).then(() =>
              router.invalidate(),
            )
          }
        />
      </div>
    </ContentPanel>
  )
}
