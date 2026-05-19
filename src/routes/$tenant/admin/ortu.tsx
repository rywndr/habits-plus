import { createFileRoute } from '@tanstack/react-router'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { DataTable  } from '#/components/admin/data-table'
import type {Column} from '#/components/admin/data-table';
import { AddEntityDialog } from '#/components/admin/add-entity-dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Button } from '#/components/ui/button'
import { students, users  } from '#/data'
import type {User} from '#/data';

export const Route = createFileRoute('/$tenant/admin/ortu')({
  component: KelolaOrtu,
  staticData: { title: 'Kelola Orang Tua' },
})

const parents = users.filter((u) => u.role === 'ortu')

function childNameOf(parentId: string): string {
  const student = students.find((s) => s.parentId === parentId)
  return student?.name ?? '-'
}

const columns: Array<Column<User>> = [
  { key: 'name', header: 'Nama', render: (r) => r.name },
  { key: 'email', header: 'Email', render: (r) => r.email },
  { key: 'child', header: 'Anak', render: (r) => childNameOf(r.id) },
]

function KelolaOrtu() {
  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader title="Kelola Orang Tua" />
        <DataTable
          rows={parents}
          columns={columns}
          filterKey="name"
          toolbar={
            <AddEntityDialog title="Tambah Orang Tua">
              <div className="flex flex-col gap-2">
                <Label htmlFor="o-name">Nama</Label>
                <Input id="o-name" placeholder="Nama lengkap" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="o-email">Email</Label>
                <Input id="o-email" type="email" placeholder="email@contoh.id" />
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
