import { createServerFn } from '@tanstack/react-start'
import { requireAdmin } from '../authorization'
import { and, eq } from 'drizzle-orm'
import { getDb } from '#/db'
import { classes } from '#/db/schema'
import { withTenantCache } from '../tenant-data'
import { assertTenantOwnedUser, assertText } from './shared'
import { addClassSchema, updateClassSchema, deleteSchema } from './schemas'

export const addClass = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .validator(addClassSchema)
  .handler(({ data, context }) =>
    withTenantCache(async () => {
      assertText(data.name, 'Nama kelas')
      const tenant = context.admin.tenant

      if (data.teacherId)
        await assertTenantOwnedUser(tenant.id, data.teacherId, 'guru')

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
  .middleware([requireAdmin])
  .validator(updateClassSchema)
  .handler(({ data, context }) =>
    withTenantCache(async () => {
      assertText(data.name, 'Nama kelas')
      const tenant = context.admin.tenant
      const klass = await getDb().query.classes.findFirst({
        where: and(eq(classes.schoolId, tenant.id), eq(classes.id, data.id)),
      })

      if (!klass) throw new Error('Kelas tidak ditemukan untuk sekolah ini.')
      if (data.teacherId)
        await assertTenantOwnedUser(tenant.id, data.teacherId, 'guru')

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
  .middleware([requireAdmin])
  .validator(deleteSchema)
  .handler(({ data, context }) =>
    withTenantCache(async () => {
      const tenant = context.admin.tenant
      await getDb()
        .delete(classes)
        .where(and(eq(classes.schoolId, tenant.id), eq(classes.id, data.id)))
    }),
  )
