import { createFileRoute } from '@tanstack/react-router'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { DataTable  } from '#/components/admin/data-table'
import type {Column} from '#/components/admin/data-table';
import { AddEntityDialog } from '#/components/admin/add-entity-dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Button } from '#/components/ui/button'
import { classes, users  } from '#/data'
import type {ClassRoom} from '#/data';

export const Route = createFileRoute('/$tenant/admin/kelas')({
  component: KelolaKelas,
  staticData: { title: 'Kelola Kelas' },
})

function teacherNameOf(id: string): string {
  return users.find((u) => u.id === id)?.name ?? '-'
}

const columns: Array<Column<ClassRoom>> = [
  { key: 'name', header: 'Nama Kelas', render: (r) => r.name },
  { key: 'teacher', header: 'Guru', render: (r) => teacherNameOf(r.teacherId) },
  {
    key: 'count',
    header: 'Jumlah Siswa',
    render: (r) => r.studentCount,
    className: 'text-center',
  },
]

function KelolaKelas() {
  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader title="Kelola Kelas" />
        <DataTable
          rows={classes}
          columns={columns}
          filterKey="name"
          toolbar={
            <AddEntityDialog title="Tambah Kelas">
              <div className="flex flex-col gap-2">
                <Label htmlFor="k-name">Nama Kelas</Label>
                <Input id="k-name" placeholder="VII A" />
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
