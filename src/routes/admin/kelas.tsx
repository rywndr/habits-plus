import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { DataTable } from '#/components/admin/data-table'
import type { Column } from '#/components/admin/data-table'
import { AddEntityDialog } from '#/components/admin/add-entity-dialog'
import { DataTableSkeleton } from '#/components/skeletons/data-table-skeleton'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '#/components/ui/select'
import { addClass, deleteClass, updateClass } from '#/server/actions'
import { loadTenantClasses, loadTenantUsers } from '#/server/loaders'
import type { AppUser, ClassRoom } from '#/server/tenant-data'

export const Route = createFileRoute('/admin/kelas')({
  loader: async ({ context }) => {
    const tenant = context.user.tenantSlug
    const [classes, users] = await Promise.all([
      loadTenantClasses({ data: { tenant } }),
      loadTenantUsers({ data: { tenant } }),
    ])

    return { classes, users }
  },
  component: KelolaKelas,
  pendingComponent: PendingKelasTable,
  staticData: { title: 'Kelola Kelas' },
})

function PendingKelasTable() {
  return <DataTableSkeleton columns={3} rows={6} />
}

function teacherNameOf(id: string | null, users: Array<AppUser>): string {
  return users.find((u) => u.id === id)?.name ?? '-'
}

function getTeachers(users: Array<AppUser>) {
  return users.filter((user) => user.role === 'guru')
}

function columns(users: Array<AppUser>): Array<Column<ClassRoom>> {
  return [
    { key: 'name', header: 'Nama Kelas', render: (r) => r.name },
    {
      key: 'teacher',
      header: 'Guru',
      render: (r) => teacherNameOf(r.teacherId, users),
      sortValue: (r) => teacherNameOf(r.teacherId, users),
    },
    {
      key: 'count',
      header: 'Jumlah Siswa',
      render: (r) => r.studentCount,
      sortValue: (r) => r.studentCount,
      className: 'text-center',
    },
  ]
}

function KelolaKelas() {
  const router = useRouter()
  const data = Route.useLoaderData()
  const teachers = getTeachers(data.users)
  const [name, setName] = useState('')
  const [teacherId, setTeacherId] = useState('none')
  const [editingClass, setEditingClass] = useState<ClassRoom | null>(null)
  const [deletingClass, setDeletingClass] = useState<ClassRoom | null>(null)

  async function handleAdd() {
    await addClass({
      data: {
        name,
        teacherId: teacherId === 'none' ? undefined : teacherId,
      },
    })
    setName('')
    setTeacherId('none')
    await router.invalidate()
  }

  async function handleEdit(klass: ClassRoom, values: ClassFormValues) {
    await updateClass({
      data: {
        id: klass.id,
        name: values.name,
        teacherId: values.teacherId === 'none' ? undefined : values.teacherId,
      },
    })
    await router.invalidate()
  }

  async function handleDelete(klass: ClassRoom) {
    await deleteClass({ data: { id: klass.id } })
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
              <TeacherSelect
                teachers={teachers}
                value={teacherId}
                onChange={setTeacherId}
              />
              <Button className="self-end" onClick={handleAdd}>
                Simpan
              </Button>
            </AddEntityDialog>
          }
          onEdit={setEditingClass}
          onDelete={setDeletingClass}
        />
        <ClassEditDialog
          klass={editingClass}
          teachers={teachers}
          open={editingClass !== null}
          onOpenChange={(open) => {
            if (!open) setEditingClass(null)
          }}
          onSave={handleEdit}
        />
        <ClassDeleteDialog
          klass={deletingClass}
          open={deletingClass !== null}
          onOpenChange={(open) => {
            if (!open) setDeletingClass(null)
          }}
          onDelete={handleDelete}
        />
      </div>
    </ContentPanel>
  )
}

type TeacherSelectProps = {
  teachers: Array<AppUser>
  value: string
  onChange: (value: string) => void
}

function TeacherSelect({ teachers, value, onChange }: TeacherSelectProps) {
  const selectedTeacher = teachers.find((teacher) => teacher.id === value)

  return (
    <div className="flex flex-col gap-2">
      <Label>Guru</Label>
      <Select
        value={value}
        onValueChange={(nextValue) => onChange(nextValue || 'none')}
      >
        <SelectTrigger className="w-full">
          <span className="min-w-0 flex-1 truncate text-left">
            {value === 'none'
              ? 'Belum ditugaskan'
              : (selectedTeacher?.name ?? 'Pilih guru')}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Belum ditugaskan</SelectItem>
          {teachers.map((teacher) => (
            <SelectItem key={teacher.id} value={teacher.id}>
              {teacher.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

type ClassFormValues = {
  name: string
  teacherId: string
}

type ClassEditDialogProps = {
  klass: ClassRoom | null
  teachers: Array<AppUser>
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (klass: ClassRoom, values: ClassFormValues) => Promise<void>
}

function ClassEditDialog({
  klass,
  teachers,
  open,
  onOpenChange,
  onSave,
}: ClassEditDialogProps) {
  const [values, setValues] = useState<ClassFormValues>({
    name: '',
    teacherId: 'none',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!klass) return

    setValues({
      name: klass.name,
      teacherId: klass.teacherId ?? 'none',
    })
  }, [klass])

  async function handleSave() {
    if (!klass) return
    setIsSaving(true)
    try {
      await onSave(klass, values)
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit kelas</DialogTitle>
          <DialogDescription>
            Ubah nama kelas dan guru yang ditugaskan.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-k-name">Nama Kelas</Label>
            <Input
              id="edit-k-name"
              value={values.name}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </div>
          <TeacherSelect
            teachers={teachers}
            value={values.teacherId}
            onChange={(nextTeacherId) =>
              setValues((current) => ({
                ...current,
                teacherId: nextTeacherId,
              }))
            }
          />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Batal
          </DialogClose>
          <Button onClick={() => void handleSave()} disabled={isSaving}>
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type ClassDeleteDialogProps = {
  klass: ClassRoom | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (klass: ClassRoom) => Promise<void>
}

function ClassDeleteDialog({
  klass,
  open,
  onOpenChange,
  onDelete,
}: ClassDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!klass) return
    setIsDeleting(true)
    try {
      await onDelete(klass)
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus kelas?</DialogTitle>
          <DialogDescription>
            Kelas {klass?.name ?? 'terpilih'} akan dihapus permanen. Kelas yang
            masih memiliki siswa tidak dapat dihapus.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>
            Batal
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={isDeleting}
          >
            {isDeleting ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
