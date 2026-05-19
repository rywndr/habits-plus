import { createFileRoute } from '@tanstack/react-router'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { DataTable  } from '#/components/admin/data-table'
import type {Column} from '#/components/admin/data-table';
import { AddEntityDialog } from '#/components/admin/add-entity-dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Button } from '#/components/ui/button'
import { users  } from '#/data'
import type {User} from '#/data';

export const Route = createFileRoute('/$tenant/admin/guru')({
  component: KelolaGuru,
  staticData: { title: 'Kelola Guru' },
})

const teachers = users.filter((u) => u.role === 'guru')

const columns: Array<Column<User>> = [
  { key: 'name', header: 'Nama', render: (r) => r.name },
  { key: 'email', header: 'Email', render: (r) => r.email },
  { key: 'tenant', header: 'Sekolah', render: (r) => r.tenantSlug },
]

function KelolaGuru() {
  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader title="Kelola Guru" />
        <DataTable
          rows={teachers}
          columns={columns}
          filterKey="name"
          toolbar={
            <AddEntityDialog title="Tambah Guru" description="Isi data guru baru.">
              <div className="flex flex-col gap-2">
                <Label htmlFor="g-name">Nama</Label>
                <Input id="g-name" placeholder="Nama lengkap" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="g-email">Email</Label>
                <Input id="g-email" type="email" placeholder="nama@sekolah.id" />
              </div>
              <Button className="self-end">Simpan</Button>
            </AddEntityDialog>
          }
          onEdit={() => undefined}
          onDelete={() => undefined}
        />
      </div>
    </ContentPanel>
  )
}
