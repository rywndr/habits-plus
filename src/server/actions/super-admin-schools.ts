import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { getDb } from '#/db'
import { schools } from '#/db/schema'
import { withTenantCache } from '../tenant-data'
import { assertText, normalizeSlug } from './shared'
import type { CreateSchoolInput, DeleteInput, UpdateSchoolInput } from './types'

export const createSchool = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateSchoolInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('../auth.server')
      await getAuthenticatedUserByRole('super-admin')

      assertText(data.name, 'Nama sekolah')
      assertText(data.slug, 'Slug sekolah')
      assertText(data.region, 'Wilayah')

      const slug = normalizeSlug(data.slug)
      if (!slug) throw new Error('Slug sekolah tidak valid.')
      if (slug === 'platform') {
        throw new Error('Slug platform tidak dapat digunakan untuk sekolah.')
      }

      await getDb()
        .insert(schools)
        .values({
          name: data.name.trim(),
          slug,
          region: data.region.trim(),
        })
        .onConflictDoUpdate({
          target: schools.slug,
          set: {
            name: data.name.trim(),
            region: data.region.trim(),
            updatedAt: new Date(),
          },
        })
    }),
  )

export const updateSchool = createServerFn({ method: 'POST' })
  .inputValidator((data: UpdateSchoolInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('../auth.server')
      await getAuthenticatedUserByRole('super-admin')

      assertText(data.id, 'Sekolah')
      assertText(data.name, 'Nama sekolah')
      assertText(data.region, 'Wilayah')

      const school = await getDb().query.schools.findFirst({
        where: eq(schools.id, data.id),
      })

      if (!school || school.slug === 'platform') {
        throw new Error('Sekolah tidak ditemukan.')
      }

      await getDb()
        .update(schools)
        .set({
          name: data.name.trim(),
          region: data.region.trim(),
          updatedAt: new Date(),
        })
        .where(eq(schools.id, data.id))
    }),
  )

export const deleteSchool = createServerFn({ method: 'POST' })
  .inputValidator((data: DeleteInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('../auth.server')
      await getAuthenticatedUserByRole('super-admin')

      const school = await getDb().query.schools.findFirst({
        where: eq(schools.id, data.id),
      })

      if (!school || school.slug === 'platform') {
        throw new Error('Sekolah tidak ditemukan.')
      }

      await getDb().delete(schools).where(eq(schools.id, data.id))
    }),
  )
