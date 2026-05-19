import { createFileRoute } from '@tanstack/react-router'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { DataTable  } from '#/components/admin/data-table'
import type {Column} from '#/components/admin/data-table';
import { AddEntityDialog } from '#/components/admin/add-entity-dialog'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Button } from '#/components/ui/button'
import { classes, students  } from '#/data'
import type {Student} from '#/data';

export const Route = createFileRoute('/$tenant/admin/siswa')({
  component: KelolaSiswa,
  staticData: { title: 'Kelola Siswa' },
})

function classNameOf(id: string): string {
  return classes.find((c) => c.id === id)?.name ?? '-'
}

const columns: Array<Column<Student>> = [
  { key: 'nisn', header: 'NISN', render: (r) => r.nisn },
  { key: 'name', header: 'Nama', render: (r) => r.name },
  { key: 'gender', header: 'L/P', render: (r) => r.gender, className: 'text-center' },
  { key: 'class', header: 'Kelas', render: (r) => classNameOf(r.classId) },
]

function KelolaSiswa() {
  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader title="Kelola Siswa" />
        <DataTable
          rows={students}
          columns={columns}
          filterKey="name"
          toolbar={
            <AddEntityDialog title="Tambah Siswa" description="Isi data siswa baru.">
              <div className="flex flex-col gap-2">
                <Label htmlFor="s-nisn">NISN</Label>
                <Input id="s-nisn" placeholder="20268xxx" />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="s-name">Nama</Label>
                <Input id="s-name" placeholder="Nama lengkap" />
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
