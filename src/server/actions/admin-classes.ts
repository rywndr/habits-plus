import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { getDb } from '#/db'
import { classes } from '#/db/schema'
import { withTenantCache } from '../tenant-data'
import {
  assertTenantOwnedUser,
  assertText,
  resolveTenant,
} from './shared'
import type { AddClassInput, DeleteInput, UpdateClassInput } from './types'

export const addClass = createServerFn({ method: 'POST' })
  .validator((data: AddClassInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      assertText(data.name, 'Nama kelas')
      const tenant = await resolveTenant(data)

      if (data.teacherId) await assertTenantOwnedUser(tenant.id, data.teacherId)

      await getDb()
        .insert(classes)
        .values({
          schoolId: tenant.id,
          name: data.name.trim(),
          teacherId: data.teacherId || null,
        })
    }),
  )

export const updateClass = createServerFn({ method: 'POST' })
  .validator((data: UpdateClassInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      assertText(data.name, 'Nama kelas')
      const tenant = await resolveTenant(data)
      const klass = await getDb().query.classes.findFirst({
        where: and(eq(classes.schoolId, tenant.id), eq(classes.id, data.id)),
      })

      if (!klass) throw new Error('Kelas tidak ditemukan untuk sekolah ini.')
      if (data.teacherId) await assertTenantOwnedUser(tenant.id, data.teacherId)

      await getDb()
        .update(classes)
        .set({
          name: data.name.trim(),
          teacherId: data.teacherId || null,
          updatedAt: new Date(),
        })
        .where(and(eq(classes.schoolId, tenant.id), eq(classes.id, data.id)))
    }),
  )

export const deleteClass = createServerFn({ method: 'POST' })
  .validator((data: DeleteInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const tenant = await resolveTenant(data)
      await getDb()
        .delete(classes)
        .where(and(eq(classes.schoolId, tenant.id), eq(classes.id, data.id)))
    }),
  )
