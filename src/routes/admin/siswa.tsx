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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { addStudent, deleteStudent } from '#/server/actions'
import { loadTenantClasses, loadTenantStudents } from '#/server/loaders'
import { DataTableSkeleton } from '#/components/skeletons/data-table-skeleton'
import type { ClassRoom, Student } from '#/server/tenant-data'

export const Route = createFileRoute('/admin/siswa')({
  loader: async ({ context }) => {
    const tenant = context.user.tenantSlug
    const [classes, students] = await Promise.all([
      loadTenantClasses({ data: { tenant } }),
      loadTenantStudents({ data: { tenant } }),
    ])

    return { classes, students }
  },
  component: KelolaSiswa,
  pendingComponent: () => <DataTableSkeleton columns={4} />,
  staticData: { title: 'Kelola Siswa' },
})

function classNameOf(id: string, classes: Array<ClassRoom>): string {
  return classes.find((c) => c.id === id)?.name ?? '-'
}

function columns(classes: Array<ClassRoom>): Array<Column<Student>> {
  return [
    { key: 'nisn', header: 'NISN', render: (r) => r.nisn },
    { key: 'name', header: 'Nama', render: (r) => r.name },
    {
      key: 'gender',
      header: 'L/P',
      render: (r) => r.gender,
      className: 'text-center',
    },
    {
      key: 'class',
      header: 'Kelas',
      render: (r) => classNameOf(r.classId, classes),
    },
  ]
}

function KelolaSiswa() {
  const router = useRouter()
  const data = Route.useLoaderData()
  const [nisn, setNisn] = useState('')
  const [name, setName] = useState('')
  const [classId, setClassId] = useState(data.classes[0]?.id ?? '')
  const [gender, setGender] = useState<'L' | 'P'>('L')

  async function handleAdd() {
    await addStudent({ data: { nisn, name, classId, gender } })
    setNisn('')
    setName('')
    await router.invalidate()
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader title="Kelola Siswa" />
        <DataTable
          rows={data.students}
          columns={columns(data.classes)}
          filterKey="name"
          toolbar={
            <AddEntityDialog
              title="Tambah Siswa"
              description="Isi data siswa baru."
            >
              <div className="flex flex-col gap-2">
                <Label htmlFor="s-nisn">NISN</Label>
                <Input
                  id="s-nisn"
                  value={nisn}
                  onChange={(event) => setNisn(event.target.value)}
                  placeholder="20268xxx"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="s-name">Nama</Label>
                <Input
                  id="s-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Nama lengkap"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Kelas</Label>
                <Select
                  value={classId}
                  onValueChange={(value) => value && setClassId(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.classes.map((klass) => (
                      <SelectItem key={klass.id} value={klass.id}>
                        {klass.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Jenis Kelamin</Label>
                <Select
                  value={gender}
                  onValueChange={(value) => setGender(value as 'L' | 'P')}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="P">P</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="self-end" onClick={handleAdd}>
                Simpan
              </Button>
            </AddEntityDialog>
          }
          onEdit={() => undefined}
          onDelete={(row) =>
            void deleteStudent({ data: { id: row.id } }).then(() =>
              router.invalidate(),
            )
          }
        />
      </div>
    </ContentPanel>
  )
}
