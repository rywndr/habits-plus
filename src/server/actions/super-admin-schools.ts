import { createSchoolSchema, updateSchoolSchema, deleteSchema } from './schemas'
import { createServerFn } from '@tanstack/react-start'
import { requireSuperAdmin } from '../authorization'
import { eq } from 'drizzle-orm'
import { getDb } from '#/db'
import { schools } from '#/db/schema'
import { withTenantCache } from '../tenant-data'
import { assertText, normalizeSlug } from './shared'

export const createSchool = createServerFn({ method: 'POST' })
  .middleware([requireSuperAdmin])
  .validator(createSchoolSchema)
  .handler(({ data }) =>
    withTenantCache(async () => {
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
  .middleware([requireSuperAdmin])
  .validator(updateSchoolSchema)
  .handler(({ data }) =>
    withTenantCache(async () => {
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
  .middleware([requireSuperAdmin])
  .validator(deleteSchema)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const school = await getDb().query.schools.findFirst({
        where: eq(schools.id, data.id),
      })

      if (!school || school.slug === 'platform') {
        throw new Error('Sekolah tidak ditemukan.')
      }

      await getDb().delete(schools).where(eq(schools.id, data.id))
    }),
  )
