import { useEffect, useMemo, useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { DataTable } from '#/components/admin/data-table'
import type { Column } from '#/components/admin/data-table'
import { AddEntityDialog } from '#/components/admin/add-entity-dialog'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
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
  createSchoolAdmin,
  deleteSchoolAdmin,
  updateSchoolAdmin,
} from '#/server/actions'
import type {
  SuperAdminSchool,
  SuperAdminSchoolAdmin,
} from '#/server/loaders'

type Props = {
  schools: Array<SuperAdminSchool>
  admins: Array<SuperAdminSchoolAdmin>
}

type SchoolAdminFormValues = {
  schoolId: string
  name: string
  email: string
  password: string
}

function adminColumns(): Array<Column<SuperAdminSchoolAdmin>> {
  return [
    { key: 'name', header: 'Nama Admin', render: (row) => row.name },
    { key: 'email', header: 'Email', render: (row) => row.email },
    {
      key: 'schoolName',
      header: 'Sekolah',
      render: (row) => row.schoolName,
      sortValue: (row) => row.schoolName,
    },
  ]
}

export function SchoolAdminsPage({ schools, admins }: Props) {
  const router = useRouter()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [filterSchoolId, setFilterSchoolId] = useState('all')
  const [values, setValues] = useState<SchoolAdminFormValues>({
    schoolId: schools[0]?.id ?? '',
    name: '',
    email: '',
    password: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [editingAdmin, setEditingAdmin] =
    useState<SuperAdminSchoolAdmin | null>(null)
  const [deletingAdmin, setDeletingAdmin] =
    useState<SuperAdminSchoolAdmin | null>(null)
  const filteredAdmins =
    filterSchoolId === 'all'
      ? admins
      : admins.filter((admin) => admin.schoolId === filterSchoolId)
  const columns = useMemo(() => adminColumns(), [])

  useEffect(() => {
    setValues((current) => ({
      ...current,
      schoolId:
        current.schoolId && schools.some((school) => school.id === current.schoolId)
          ? current.schoolId
          : (schools[0]?.id ?? ''),
    }))
  }, [schools])

  async function handleAdd() {
    setIsSaving(true)
    try {
      await createSchoolAdmin({ data: values })
      setValues((current) => ({
        schoolId: current.schoolId,
        name: '',
        email: '',
        password: '',
      }))
      setIsAddOpen(false)
      await router.invalidate()
    } finally {
      setIsSaving(false)
    }
  }

  async function handleEdit(
    admin: SuperAdminSchoolAdmin,
    nextValues: SchoolAdminFormValues,
  ) {
    await updateSchoolAdmin({
      data: {
        id: admin.id,
        schoolId: nextValues.schoolId,
        name: nextValues.name,
        email: nextValues.email,
        password: nextValues.password || undefined,
      },
    })
    await router.invalidate()
  }

  async function handleDelete(admin: SuperAdminSchoolAdmin) {
    await deleteSchoolAdmin({ data: { id: admin.id } })
    await router.invalidate()
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-6">
        <PageHeader title="Admin Sekolah" />
        <DataTable
          rows={filteredAdmins}
          columns={columns}
          filterKey="name"
          toolbar={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <SchoolFilter
                schools={schools}
                value={filterSchoolId}
                onChange={setFilterSchoolId}
              />
              <AddEntityDialog
                title="Tambah Admin Sekolah"
                description="Buat akun admin untuk sekolah yang sudah terdaftar."
                open={isAddOpen}
                onOpenChange={setIsAddOpen}
              >
                <SchoolAdminForm
                  schools={schools}
                  values={values}
                  onChange={setValues}
                />
                <Button
                  className="self-end"
                  onClick={handleAdd}
                  disabled={isSaving || !values.schoolId}
                >
                  {isSaving ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </AddEntityDialog>
            </div>
          }
          onEdit={setEditingAdmin}
          onDelete={setDeletingAdmin}
        />
        <SchoolAdminEditDialog
          admin={editingAdmin}
          schools={schools}
          open={editingAdmin !== null}
          onOpenChange={(open) => {
            if (!open) setEditingAdmin(null)
          }}
          onSave={handleEdit}
        />
        <SchoolAdminDeleteDialog
          admin={deletingAdmin}
          open={deletingAdmin !== null}
          onOpenChange={(open) => {
            if (!open) setDeletingAdmin(null)
          }}
          onDelete={handleDelete}
        />
      </div>
    </ContentPanel>
  )
}

type SchoolSelectProps = {
  schools: Array<SuperAdminSchool>
  value: string
  onChange: (value: string) => void
}

function SchoolSelect({ schools, value, onChange }: SchoolSelectProps) {
  const selectedSchool = schools.find((school) => school.id === value)

  return (
    <div className="grid gap-2">
      <Label>Sekolah</Label>
      <Select
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue) onChange(nextValue)
        }}
      >
        <SelectTrigger className="w-full">
          <span className="min-w-0 flex-1 truncate text-left">
            {selectedSchool?.name ?? 'Pilih sekolah'}
          </span>
        </SelectTrigger>
        <SelectContent>
          {schools.map((school) => (
            <SelectItem key={school.id} value={school.id}>
              {school.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

type SchoolFilterProps = {
  schools: Array<SuperAdminSchool>
  value: string
  onChange: (value: string) => void
}

function SchoolFilter({ schools, value, onChange }: SchoolFilterProps) {
  const selectedSchool = schools.find((school) => school.id === value)

  return (
    <Select
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue) onChange(nextValue)
      }}
    >
      <SelectTrigger className="w-full bg-card sm:w-64">
        <span className="min-w-0 flex-1 truncate text-left">
          {value === 'all' ? 'Semua sekolah' : selectedSchool?.name}
        </span>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Semua sekolah</SelectItem>
        {schools.map((school) => (
          <SelectItem key={school.id} value={school.id}>
            {school.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

type SchoolAdminFormProps = {
  schools: Array<SuperAdminSchool>
  values: SchoolAdminFormValues
  onChange: (values: SchoolAdminFormValues) => void
}

function SchoolAdminForm({
  schools,
  values,
  onChange,
}: SchoolAdminFormProps) {
  return (
    <>
      <SchoolSelect
        schools={schools}
        value={values.schoolId}
        onChange={(schoolId) => onChange({ ...values, schoolId })}
      />
      <div className="grid gap-2">
        <Label htmlFor="admin-name">Nama Admin</Label>
        <Input
          id="admin-name"
          value={values.name}
          onChange={(event) =>
            onChange({ ...values, name: event.target.value })
          }
          placeholder="Nama lengkap"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="admin-email">Email</Label>
        <Input
          id="admin-email"
          value={values.email}
          onChange={(event) =>
            onChange({ ...values, email: event.target.value })
          }
          placeholder="admin@sekolah.sch.id"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="admin-password">Kata Sandi</Label>
        <Input
          id="admin-password"
          type="password"
          value={values.password}
          onChange={(event) =>
            onChange({ ...values, password: event.target.value })
          }
          placeholder="Kata sandi awal"
        />
      </div>
    </>
  )
}

type SchoolAdminEditDialogProps = {
  admin: SuperAdminSchoolAdmin | null
  schools: Array<SuperAdminSchool>
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (
    admin: SuperAdminSchoolAdmin,
    values: SchoolAdminFormValues,
  ) => Promise<void>
}

function SchoolAdminEditDialog({
  admin,
  schools,
  open,
  onOpenChange,
  onSave,
}: SchoolAdminEditDialogProps) {
  const [values, setValues] = useState<SchoolAdminFormValues>({
    schoolId: '',
    name: '',
    email: '',
    password: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!admin) return
    setValues({
      schoolId: admin.schoolId,
      name: admin.name,
      email: admin.email,
      password: '',
    })
  }, [admin])

  async function handleSave() {
    if (!admin) return
    setIsSaving(true)
    try {
      await onSave(admin, values)
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit admin sekolah</DialogTitle>
          <DialogDescription>
            Ubah sekolah, nama, email, atau kata sandi admin.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <SchoolAdminForm
            schools={schools}
            values={values}
            onChange={setValues}
          />
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type SchoolAdminDeleteDialogProps = {
  admin: SuperAdminSchoolAdmin | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (admin: SuperAdminSchoolAdmin) => Promise<void>
}

function SchoolAdminDeleteDialog({
  admin,
  open,
  onOpenChange,
  onDelete,
}: SchoolAdminDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!admin) return
    setIsDeleting(true)
    try {
      await onDelete(admin)
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus admin sekolah?</DialogTitle>
          <DialogDescription>
            Akun {admin?.name} untuk {admin?.schoolName} akan dihapus.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Menghapus...' : 'Hapus'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
