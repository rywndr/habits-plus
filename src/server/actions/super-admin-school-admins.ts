import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { getDb } from '#/db'
import { schools, users } from '#/db/schema'
import { withTenantCache } from '../tenant-data'
import { assertText, upsertCredentialAccount, upsertUserByEmail } from './shared'
import type {
  CreateSchoolAdminInput,
  DeleteInput,
  UpdateSchoolAdminInput,
} from './types'

export const createSchoolAdmin = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateSchoolAdminInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('../auth.server')
      await getAuthenticatedUserByRole('super-admin')

      assertText(data.schoolId, 'Sekolah')
      assertText(data.name, 'Nama admin')
      assertText(data.email, 'Email')
      assertText(data.password, 'Kata sandi')

      const school = await getDb().query.schools.findFirst({
        where: eq(schools.id, data.schoolId),
      })

      if (!school || school.slug === 'platform') {
        throw new Error('Sekolah tidak ditemukan.')
      }

      await upsertUserByEmail({
        tenantId: school.id,
        tenantSlug: school.slug,
        name: data.name,
        email: data.email,
        password: data.password,
        role: 'admin',
      })
    }),
  )

export const updateSchoolAdmin = createServerFn({ method: 'POST' })
  .inputValidator((data: UpdateSchoolAdminInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('../auth.server')
      await getAuthenticatedUserByRole('super-admin')

      assertText(data.id, 'Admin')
      assertText(data.schoolId, 'Sekolah')
      assertText(data.name, 'Nama admin')
      assertText(data.email, 'Email')

      const school = await getDb().query.schools.findFirst({
        where: eq(schools.id, data.schoolId),
      })

      if (!school || school.slug === 'platform') {
        throw new Error('Sekolah tidak ditemukan.')
      }

      const existingAdmin = await getDb().query.users.findFirst({
        where: and(eq(users.id, data.id), eq(users.role, 'admin')),
      })

      if (!existingAdmin) {
        throw new Error('Admin sekolah tidak ditemukan.')
      }

      await getDb()
        .update(users)
        .set({
          schoolId: school.id,
          tenantSlug: school.slug,
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          role: 'admin',
          updatedAt: new Date(),
        })
        .where(and(eq(users.id, data.id), eq(users.role, 'admin')))

      await upsertCredentialAccount(data.id, data.password)
    }),
  )

export const deleteSchoolAdmin = createServerFn({ method: 'POST' })
  .inputValidator((data: DeleteInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('../auth.server')
      await getAuthenticatedUserByRole('super-admin')

      await getDb()
        .delete(users)
        .where(and(eq(users.id, data.id), eq(users.role, 'admin')))
    }),
  )
