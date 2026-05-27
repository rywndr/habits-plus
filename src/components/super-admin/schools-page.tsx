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
import { createSchool, deleteSchool, updateSchool } from '#/server/actions'
import type { SuperAdminSchool } from '#/server/loaders'

type Props = {
  schools: Array<SuperAdminSchool>
}

type SchoolFormValues = {
  name: string
  region: string
}

function schoolColumns(): Array<Column<SuperAdminSchool>> {
  return [
    { key: 'name', header: 'Nama Sekolah', render: (row) => row.name },
    { key: 'region', header: 'Wilayah', render: (row) => row.region },
    {
      key: 'adminCount',
      header: 'Admin',
      render: (row) => row.adminCount,
      sortValue: (row) => row.adminCount,
      className: 'text-center',
    },
  ]
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function SchoolsPage({ schools }: Props) {
  const router = useRouter()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [name, setName] = useState('')
  const [region, setRegion] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [editingSchool, setEditingSchool] = useState<SuperAdminSchool | null>(
    null,
  )
  const [deletingSchool, setDeletingSchool] = useState<SuperAdminSchool | null>(
    null,
  )
  const columns = useMemo(() => schoolColumns(), [])

  async function handleAdd() {
    setIsSaving(true)
    try {
      await createSchool({
        data: { name, slug: slugify(name), region },
      })
      setName('')
      setRegion('')
      setIsAddOpen(false)
      await router.invalidate()
    } finally {
      setIsSaving(false)
    }
  }

  async function handleEdit(
    school: SuperAdminSchool,
    values: SchoolFormValues,
  ) {
    await updateSchool({
      data: { id: school.id, name: values.name, region: values.region },
    })
    await router.invalidate()
  }

  async function handleDelete(school: SuperAdminSchool) {
    await deleteSchool({ data: { id: school.id } })
    await router.invalidate()
  }

  return (
    <ContentPanel>
      <div className="flex flex-col gap-6">
        <PageHeader title="Tambah Sekolah" />
        <DataTable
          rows={schools}
          columns={columns}
          filterKey="name"
          toolbar={
            <AddEntityDialog
              title="Tambah Sekolah"
              description="Tambahkan tenant sekolah baru sebelum membuat akun adminnya."
              open={isAddOpen}
              onOpenChange={setIsAddOpen}
            >
              <SchoolForm
                values={{ name, region }}
                onChange={({ name: nextName, region: nextRegion }) => {
                  setName(nextName)
                  setRegion(nextRegion)
                }}
              />
              <Button
                className="self-end"
                onClick={handleAdd}
                disabled={isSaving}
              >
                {isSaving ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </AddEntityDialog>
          }
          onEdit={setEditingSchool}
          onDelete={setDeletingSchool}
        />
        <SchoolEditDialog
          school={editingSchool}
          open={editingSchool !== null}
          onOpenChange={(open) => {
            if (!open) setEditingSchool(null)
          }}
          onSave={handleEdit}
        />
        <SchoolDeleteDialog
          school={deletingSchool}
          open={deletingSchool !== null}
          onOpenChange={(open) => {
            if (!open) setDeletingSchool(null)
          }}
          onDelete={handleDelete}
        />
      </div>
    </ContentPanel>
  )
}

type SchoolFormProps = {
  values: SchoolFormValues
  onChange: (values: SchoolFormValues) => void
}

function SchoolForm({ values, onChange }: SchoolFormProps) {
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor="school-name">Nama Sekolah</Label>
        <Input
          id="school-name"
          value={values.name}
          onChange={(event) =>
            onChange({ ...values, name: event.target.value })
          }
          placeholder="SLB Negeri Contoh"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="school-region">Wilayah</Label>
        <Input
          id="school-region"
          value={values.region}
          onChange={(event) =>
            onChange({ ...values, region: event.target.value })
          }
          placeholder="Kota Batam"
        />
      </div>
    </>
  )
}

type SchoolEditDialogProps = {
  school: SuperAdminSchool | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (
    school: SuperAdminSchool,
    values: SchoolFormValues,
  ) => Promise<void>
}

function SchoolEditDialog({
  school,
  open,
  onOpenChange,
  onSave,
}: SchoolEditDialogProps) {
  const [values, setValues] = useState<SchoolFormValues>({
    name: '',
    region: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!school) return
    setValues({ name: school.name, region: school.region })
  }, [school])

  async function handleSave() {
    if (!school) return
    setIsSaving(true)
    try {
      await onSave(school, values)
      onOpenChange(false)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit sekolah</DialogTitle>
          <DialogDescription>Ubah nama sekolah dan wilayah.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <SchoolForm values={values} onChange={setValues} />
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

type SchoolDeleteDialogProps = {
  school: SuperAdminSchool | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (school: SuperAdminSchool) => Promise<void>
}

function SchoolDeleteDialog({
  school,
  open,
  onOpenChange,
  onDelete,
}: SchoolDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    if (!school) return
    setIsDeleting(true)
    try {
      await onDelete(school)
      onOpenChange(false)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus sekolah?</DialogTitle>
          <DialogDescription>
            Data sekolah {school?.name} akan dihapus dari sistem.
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
