import { useState } from 'react'
import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { EntityFormPage } from '#/components/admin/entity-form-page'
import {
  SchoolForm,
  schoolFormValues,
} from '#/components/super-admin/forms/school-form'
import { affectsSuperAdminData } from '#/lib/route-invalidation'
import { createSchool } from '#/server/actions'

export const Route = createFileRoute('/super-admin/tenants_/new')({
  component: NewSchoolRoute,
  staticData: { title: 'Tambah Tenant' },
})

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function NewSchoolRoute() {
  const navigate = Route.useNavigate()
  const router = useRouter()
  const [values, setValues] = useState(() => schoolFormValues())

  async function handleSubmit() {
    await createSchool({
      data: {
        ...values,
        slug: slugify(values.name),
      },
    })
    await router.invalidate({ filter: affectsSuperAdminData })
    await navigate({ to: '/super-admin/tenants' })
  }

  return (
    <EntityFormPage
      title="Tambah Tenant"
      description="Daftarkan tenant baru. Akun tenant admin dapat dibuat setelah tenant tersimpan."
      cancelLink={<Link to="/super-admin/tenants" />}
      onSubmit={handleSubmit}
    >
      <SchoolForm values={values} onChange={setValues} idPrefix="new-school" />
    </EntityFormPage>
  )
}
