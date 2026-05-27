import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
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
import { addStudent, deleteStudent, updateStudent } from '#/server/actions'
import { loadTenantClasses, loadTenantStudents } from '#/server/loaders'
import type { ClassRoom, Gender, Student } from '#/server/tenant-data'

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
  pendingComponent: PendingSiswaTable,
  staticData: { title: 'Kelola Siswa' },
})

function PendingSiswaTable() {
  return <DataTableSkeleton columns={4} rows={10} />
}

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
      sortValue: (r) => classNameOf(r.classId, classes),
    },
  ]
}

type StudentFormValues = {
  nisn: string
  name: string
  classId: string
  gender: Gender
}

function KelolaSiswa() {
  const router = useRouter()
  const data = Route.useLoaderData()
  const [nisn, setNisn] = useState('')
  const [name, setName] = useState('')
  const [classId, setClassId] = useState(data.classes[0]?.id ?? '')
  const [gender, setGender] = useState<Gender>('L')
  const [classFilter, setClassFilter] = useState('all')
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null)
  const filteredStudents = useMemo(
    () =>
      classFilter === 'all'
        ? data.students
        : data.students.filter((student) => student.classId === classFilter),
    [classFilter, data.students],
  )

  async function handleAdd() {
    await addStudent({ data: { nisn, name, classId, gender } })
    setNisn('')
    setName('')
    await router.invalidate()
  }

  async function handleEdit(student: Student, values: StudentFormValues) {
    await updateStudent({
      data: {
        id: student.id,
        nisn: values.nisn,
        name: values.name,
        classId: values.classId,
        gender: values.gender,
      },
    })
    await router.invalidate()
  }

  async function handleDelete(student: Student) {
    await deleteStudent({ data: { id: student.id } })
    await router.invalidate()
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader title="Kelola Siswa" />
        <DataTable
          rows={filteredStudents}
          columns={columns(data.classes)}
          filterKey="name"
          toolbar={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <ClassFilterSelect
                classes={data.classes}
                value={classFilter}
                onChange={setClassFilter}
              />
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
                <StudentClassSelect
                  classes={data.classes}
                  value={classId}
                  onChange={setClassId}
                />
                <StudentGenderSelect value={gender} onChange={setGender} />
                <Button className="self-end" onClick={handleAdd}>
                  Simpan
                </Button>
              </AddEntityDialog>
            </div>
          }
          onEdit={setEditingStudent}
          onDelete={setDeletingStudent}
        />
        <StudentEditDialog
          student={editingStudent}
          classes={data.classes}
          open={editingStudent !== null}
          onOpenChange={(open) => {
            if (!open) setEditingStudent(null)
          }}
          onSave={handleEdit}
        />
        <StudentDeleteDialog
          student={deletingStudent}
          open={deletingStudent !== null}
          onOpenChange={(open) => {
            if (!open) setDeletingStudent(null)
          }}
          onDelete={handleDelete}
        />
      </div>
    </ContentPanel>
  )
}

type ClassSelectProps = {
  classes: Array<ClassRoom>
  value: string
  onChange: (value: string) => void
}

function StudentClassSelect({ classes, value, onChange }: ClassSelectProps) {
  const selectedClass = classes.find((klass) => klass.id === value)

  return (
    <div className="flex flex-col gap-2">
      <Label>Kelas</Label>
      <Select
        value={value}
        onValueChange={(nextValue) => nextValue && onChange(nextValue)}
      >
        <SelectTrigger className="w-full">
          <span className="min-w-0 flex-1 truncate text-left">
            {selectedClass?.name ?? 'Pilih kelas'}
          </span>
        </SelectTrigger>
        <SelectContent>
          {classes.map((klass) => (
            <SelectItem key={klass.id} value={klass.id}>
              {klass.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function ClassFilterSelect({ classes, value, onChange }: ClassSelectProps) {
  const selectedClass = classes.find((klass) => klass.id === value)

  return (
    <Select
      value={value}
      onValueChange={(nextValue) => onChange(nextValue || 'all')}
    >
      <SelectTrigger className="w-full bg-card sm:w-44">
        <span className="min-w-0 flex-1 truncate text-left">
          {value === 'all' ? 'Semua kelas' : (selectedClass?.name ?? 'Kelas')}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Semua kelas</SelectItem>
        {classes.map((klass) => (
          <SelectItem key={klass.id} value={klass.id}>
            {klass.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

type GenderSelectProps = {
  value: Gender
  onChange: (value: Gender) => void
}

function StudentGenderSelect({ value, onChange }: GenderSelectProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label>Jenis Kelamin</Label>
      <Select
        value={value}
        onValueChange={(nextValue) => onChange(nextValue as Gender)}
      >
        <SelectTrigger className="w-full">
          <span className="min-w-0 flex-1 truncate text-left">{value}</span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="L">L</SelectItem>
          <SelectItem value="P">P</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

type StudentEditDialogProps = {
  student: Student | null
  classes: Array<ClassRoom>
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (student: Student, values: StudentFormValues) => Promise<void>
}

function StudentEditDialog({
  student,
  classes,
  open,
  onOpenChange,
  onSave,
}: StudentEditDialogProps) {
  const [values, setValues] = useState<StudentFormValues>({
    nisn: '',
    name: '',
    classId: '',
    gender: 'L',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!student) return

    setValues({
      nisn: student.nisn,
      name: student.name,
      classId: student.classId,
      gender: student.gender,
    })
  }, [student])

  async function handleSave() {
    if (!student) return
    setIsSaving(true)
    try {
      await onSave(student, values)
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit siswa</DialogTitle>
          <DialogDescription>
            Ubah identitas siswa dan kelas aktifnya.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-s-nisn">NISN</Label>
            <Input
              id="edit-s-nisn"
              value={values.nisn}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  nisn: event.target.value,
                }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-s-name">Nama</Label>
            <Input
              id="edit-s-name"
              value={values.name}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </div>
          <StudentClassSelect
            classes={classes}
            value={values.classId}
            onChange={(nextClassId) =>
              setValues((current) => ({
                ...current,
                classId: nextClassId,
              }))
            }
          />
          <StudentGenderSelect
            value={values.gender}
            onChange={(nextGender) =>
              setValues((current) => ({
                ...current,
                gender: nextGender,
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

type StudentDeleteDialogProps = {
  student: Student | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (student: Student) => Promise<void>
}

function StudentDeleteDialog({
  student,
  open,
  onOpenChange,
  onDelete,
}: StudentDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!student) return
    setIsDeleting(true)
    try {
      await onDelete(student)
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus siswa?</DialogTitle>
          <DialogDescription>
            Data {student?.name ?? 'siswa terpilih'} akan dihapus permanen.
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
