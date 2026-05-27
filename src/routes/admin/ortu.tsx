import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { addUser, deleteUser, updateUser } from '#/server/actions'
import {
  loadTenantClasses,
  loadTenantStudents,
  loadTenantUsers,
} from '#/server/loaders'
import type { AppUser, ClassRoom, Student } from '#/server/tenant-data'

export const Route = createFileRoute('/admin/ortu')({
  loader: async ({ context }) => {
    const tenant = context.user.tenantSlug
    const [users, students, classes] = await Promise.all([
      loadTenantUsers({ data: { tenant } }),
      loadTenantStudents({ data: { tenant } }),
      loadTenantClasses({ data: { tenant } }),
    ])

    return {
      parents: users.filter((user) => user.role === 'ortu'),
      students,
      classes,
    }
  },
  component: KelolaOrtu,
  pendingComponent: PendingOrtuTable,
  staticData: { title: 'Kelola Orang Tua' },
})

function PendingOrtuTable() {
  return <DataTableSkeleton columns={3} rows={8} />
}

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
      sortValue: (r) => childNameOf(r.id, students),
    },
  ]
}

function KelolaOrtu() {
  const router = useRouter()
  const { parents, students, classes } = Route.useLoaderData()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [studentId, setStudentId] = useState('none')
  const [editingParent, setEditingParent] = useState<AppUser | null>(null)
  const [deletingParent, setDeletingParent] = useState<AppUser | null>(null)

  async function handleAdd() {
    await addUser({
      data: {
        name,
        email,
        password,
        role: 'ortu',
        studentId: studentId === 'none' ? undefined : studentId,
      },
    })
    setName('')
    setEmail('')
    setPassword('')
    setStudentId('none')
    await router.invalidate()
  }

  async function handleEdit(parent: AppUser, values: ParentFormValues) {
    await updateUser({
      data: {
        id: parent.id,
        name: values.name,
        email: values.email,
        password: values.password || undefined,
        role: 'ortu',
        studentId: values.studentId === 'none' ? undefined : values.studentId,
      },
    })
    await router.invalidate()
  }

  async function handleDelete(parent: AppUser) {
    await deleteUser({ data: { id: parent.id } })
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
              <StudentSelect
                students={students}
                classes={classes}
                value={studentId}
                onChange={setStudentId}
              />
              <Button className="self-end" onClick={handleAdd}>
                Simpan
              </Button>
            </AddEntityDialog>
          }
          onEdit={setEditingParent}
          onDelete={setDeletingParent}
        />
        <ParentEditDialog
          parent={editingParent}
          students={students}
          classes={classes}
          open={editingParent !== null}
          onOpenChange={(open) => {
            if (!open) setEditingParent(null)
          }}
          onSave={handleEdit}
        />
        <ParentDeleteDialog
          parent={deletingParent}
          open={deletingParent !== null}
          onOpenChange={(open) => {
            if (!open) setDeletingParent(null)
          }}
          onDelete={handleDelete}
        />
      </div>
    </ContentPanel>
  )
}

type StudentSelectProps = {
  students: Array<Student>
  classes: Array<ClassRoom>
  value: string
  onChange: (value: string) => void
}

function classNameOf(id: string, classes: Array<ClassRoom>) {
  return classes.find((klass) => klass.id === id)?.name ?? '-'
}

function StudentSelect({
  students,
  classes,
  value,
  onChange,
}: StudentSelectProps) {
  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const selectedStudent = students.find((student) => student.id === value)
  const filteredStudents = students.filter((student) => {
    const normalizedQuery = query.trim().toLowerCase()
    const matchesClass =
      classFilter === 'all' || student.classId === classFilter
    const matchesQuery =
      !normalizedQuery ||
      student.name.toLowerCase().includes(normalizedQuery) ||
      student.nisn.toLowerCase().includes(normalizedQuery)

    return matchesClass && matchesQuery
  })

  return (
    <div className="flex flex-col gap-2">
      <Label>Anak</Label>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="h-auto min-h-10 w-full justify-between gap-2 bg-card text-left font-normal"
            />
          }
        >
          <span className="min-w-0 flex-1 truncate">
            {selectedStudent
              ? `${selectedStudent.name} (${classNameOf(selectedStudent.classId, classes)})`
              : 'Pilih siswa'}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-96 max-w-[90vw] gap-3 p-3">
          <div className="grid gap-2">
            <Select
              value={classFilter}
              onValueChange={(nextValue) => setClassFilter(nextValue || 'all')}
            >
              <SelectTrigger className="w-full">
                <span className="min-w-0 flex-1 truncate text-left">
                  {classFilter === 'all'
                    ? 'Semua kelas'
                    : classNameOf(classFilter, classes)}
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
            <div className="relative">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cari nama atau NISN..."
                className="pl-9"
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto pr-1">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => onChange('none')}
            >
              <span className="grid size-4 shrink-0 place-items-center rounded-sm border border-border">
                {value === 'none' ? <Check className="size-3" /> : null}
              </span>
              <span className="min-w-0 flex-1 truncate">Belum ditautkan</span>
            </button>
            {filteredStudents.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                Tidak ada siswa.
              </p>
            ) : (
              filteredStudents.map((student) => {
                const isSelected = student.id === value

                return (
                  <button
                    key={student.id}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                    onClick={() => onChange(student.id)}
                  >
                    <span className="grid size-4 shrink-0 place-items-center rounded-sm border border-border">
                      {isSelected ? <Check className="size-3" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{student.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {student.nisn} · {classNameOf(student.classId, classes)}
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
      {selectedStudent ? (
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            <span className="truncate">
              {selectedStudent.name} ·{' '}
              {classNameOf(selectedStudent.classId, classes)}
            </span>
            <button
              type="button"
              aria-label={`Hapus tautan ${selectedStudent.name}`}
              className="rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => onChange('none')}
            >
              <X className="size-3" />
            </button>
          </span>
        </div>
      ) : null}
    </div>
  )
}

type ParentFormValues = {
  name: string
  email: string
  password: string
  studentId: string
}

type ParentEditDialogProps = {
  parent: AppUser | null
  students: Array<Student>
  classes: Array<ClassRoom>
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (parent: AppUser, values: ParentFormValues) => Promise<void>
}

function ParentEditDialog({
  parent,
  students,
  classes,
  open,
  onOpenChange,
  onSave,
}: ParentEditDialogProps) {
  const [values, setValues] = useState<ParentFormValues>({
    name: '',
    email: '',
    password: '',
    studentId: 'none',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!parent) return

    setValues({
      name: parent.name,
      email: parent.email,
      password: '',
      studentId: parent.studentId ?? 'none',
    })
  }, [parent])

  async function handleSave() {
    if (!parent) return
    setIsSaving(true)
    try {
      await onSave(parent, values)
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit orang tua</DialogTitle>
          <DialogDescription>
            Ubah akun orang tua dan siswa yang ditautkan.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-o-name">Nama</Label>
            <Input
              id="edit-o-name"
              value={values.name}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-o-email">Email</Label>
            <Input
              id="edit-o-email"
              type="email"
              value={values.email}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-o-password">Kata sandi baru</Label>
            <Input
              id="edit-o-password"
              type="password"
              value={values.password}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              placeholder="Kosongkan jika tidak diubah"
            />
          </div>
          <StudentSelect
            students={students}
            classes={classes}
            value={values.studentId}
            onChange={(nextStudentId) =>
              setValues((current) => ({
                ...current,
                studentId: nextStudentId,
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

type ParentDeleteDialogProps = {
  parent: AppUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (parent: AppUser) => Promise<void>
}

function ParentDeleteDialog({
  parent,
  open,
  onOpenChange,
  onDelete,
}: ParentDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!parent) return
    setIsDeleting(true)
    try {
      await onDelete(parent)
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus orang tua?</DialogTitle>
          <DialogDescription>
            Akun {parent?.name ?? 'orang tua terpilih'} akan dihapus permanen.
            Siswa yang tertaut akan kembali tanpa akun orang tua.
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
