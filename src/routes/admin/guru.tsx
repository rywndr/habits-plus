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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { addUser, deleteUser, updateUser } from '#/server/actions'
import { loadTenantClasses, loadTenantUsers } from '#/server/loaders'
import type { AppUser, ClassRoom } from '#/server/tenant-data'

export const Route = createFileRoute('/admin/guru')({
  loader: async () => {
    const [users, classes] = await Promise.all([
      loadTenantUsers(),
      loadTenantClasses(),
    ])

    return {
      teachers: users.filter((user) => user.role === 'guru'),
      classes,
    }
  },
  component: KelolaGuru,
  staleTime: 30_000,
  pendingComponent: PendingGuruTable,
  staticData: { title: 'Kelola Guru' },
})

function PendingGuruTable() {
  return <DataTableSkeleton columns={3} rows={8} />
}

function teacherClassLabel(teacher: AppUser) {
  return teacher.classNames?.join(', ') || '-'
}

const columns: Array<Column<AppUser>> = [
  { key: 'name', header: 'Nama', render: (r) => r.name },
  { key: 'email', header: 'Email', render: (r) => r.email },
  {
    key: 'classes',
    header: 'Kelas',
    render: teacherClassLabel,
    sortValue: teacherClassLabel,
  },
]

type TeacherFormValues = {
  name: string
  email: string
  password: string
  classIds: Array<string>
}

function KelolaGuru() {
  const router = useRouter()
  const data = Route.useLoaderData()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [classIds, setClassIds] = useState<Array<string>>([])
  const [editingTeacher, setEditingTeacher] = useState<AppUser | null>(null)
  const [deletingTeacher, setDeletingTeacher] = useState<AppUser | null>(null)

  async function handleAdd() {
    await addUser({
      data: { name, email, password, role: 'guru', classIds },
    })
    setName('')
    setEmail('')
    setPassword('')
    setClassIds([])
    await router.invalidate()
  }

  async function handleEdit(teacher: AppUser, values: TeacherFormValues) {
    await updateUser({
      data: {
        id: teacher.id,
        name: values.name,
        email: values.email,
        password: values.password || undefined,
        role: 'guru',
        classIds: values.classIds,
      },
    })
    await router.invalidate()
  }

  async function handleDelete(teacher: AppUser) {
    await deleteUser({ data: { id: teacher.id } })
    await router.invalidate()
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-5">
        <PageHeader title="Kelola Guru" />
        <DataTable
          rows={data.teachers}
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
              <ClassAssignmentField
                classes={data.classes}
                value={classIds}
                onChange={setClassIds}
              />
              <Button className="self-end" onClick={handleAdd}>
                Simpan
              </Button>
            </AddEntityDialog>
          }
          onEdit={setEditingTeacher}
          onDelete={setDeletingTeacher}
        />
        <TeacherEditDialog
          teacher={editingTeacher}
          classes={data.classes}
          open={editingTeacher !== null}
          onOpenChange={(open) => {
            if (!open) setEditingTeacher(null)
          }}
          onSave={handleEdit}
        />
        <TeacherDeleteDialog
          teacher={deletingTeacher}
          open={deletingTeacher !== null}
          onOpenChange={(open) => {
            if (!open) setDeletingTeacher(null)
          }}
          onDelete={handleDelete}
        />
      </div>
    </ContentPanel>
  )
}

type ClassAssignmentFieldProps = {
  classes: Array<ClassRoom>
  value: Array<string>
  onChange: (value: Array<string>) => void
}

function ClassAssignmentField({
  classes,
  value,
  onChange,
}: ClassAssignmentFieldProps) {
  const [query, setQuery] = useState('')
  const selectedClasses = classes.filter((klass) => value.includes(klass.id))
  const filteredClasses = classes.filter((klass) =>
    klass.name.toLowerCase().includes(query.toLowerCase()),
  )

  function toggleClass(id: string) {
    onChange(
      value.includes(id)
        ? value.filter((classId) => classId !== id)
        : [...value, id],
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>Kelas yang diampu</Label>
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
            {selectedClasses.length
              ? `${selectedClasses.length} kelas dipilih`
              : 'Pilih kelas'}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 max-w-[90vw] gap-3 p-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari kelas..."
              className="pl-9"
            />
          </div>
          <div className="max-h-60 overflow-y-auto pr-1">
            {filteredClasses.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                Tidak ada kelas.
              </p>
            ) : (
              filteredClasses.map((klass) => {
                const isSelected = value.includes(klass.id)

                return (
                  <button
                    key={klass.id}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                    onClick={() => toggleClass(klass.id)}
                  >
                    <span className="grid size-4 shrink-0 place-items-center rounded-sm border border-border">
                      {isSelected ? <Check className="size-3" /> : null}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {klass.name}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
      {selectedClasses.length ? (
        <div className="flex flex-wrap gap-2">
          {selectedClasses.map((klass) => (
            <span
              key={klass.id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
            >
              <span className="truncate">{klass.name}</span>
              <button
                type="button"
                aria-label={`Hapus ${klass.name}`}
                className="rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => toggleClass(klass.id)}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

type TeacherEditDialogProps = {
  teacher: AppUser | null
  classes: Array<ClassRoom>
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (teacher: AppUser, values: TeacherFormValues) => Promise<void>
}

function TeacherEditDialog({
  teacher,
  classes,
  open,
  onOpenChange,
  onSave,
}: TeacherEditDialogProps) {
  const [values, setValues] = useState<TeacherFormValues>({
    name: '',
    email: '',
    password: '',
    classIds: [],
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!teacher) return

    setValues({
      name: teacher.name,
      email: teacher.email,
      password: '',
      classIds: teacher.classIds ?? [],
    })
  }, [teacher])

  async function handleSave() {
    if (!teacher) return
    setIsSaving(true)
    try {
      await onSave(teacher, values)
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit guru</DialogTitle>
          <DialogDescription>
            Ubah data guru dan kelas yang ditugaskan.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-g-name">Nama</Label>
            <Input
              id="edit-g-name"
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
            <Label htmlFor="edit-g-email">Email</Label>
            <Input
              id="edit-g-email"
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
            <Label htmlFor="edit-g-password">Kata sandi baru</Label>
            <Input
              id="edit-g-password"
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
          <ClassAssignmentField
            classes={classes}
            value={values.classIds}
            onChange={(nextClassIds) =>
              setValues((current) => ({
                ...current,
                classIds: nextClassIds,
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

type TeacherDeleteDialogProps = {
  teacher: AppUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (teacher: AppUser) => Promise<void>
}

function TeacherDeleteDialog({
  teacher,
  open,
  onOpenChange,
  onDelete,
}: TeacherDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!teacher) return
    setIsDeleting(true)
    try {
      await onDelete(teacher)
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus guru?</DialogTitle>
          <DialogDescription>
            Akun {teacher?.name ?? 'guru terpilih'} akan dihapus permanen. Kelas
            yang diampu akan kembali tanpa guru.
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
