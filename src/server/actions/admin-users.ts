import { createServerFn } from '@tanstack/react-start'
import { requireAdmin } from '../authorization'
import { and, eq, inArray } from 'drizzle-orm'
import { getDb } from '#/db'
import { accounts, CREDENTIAL_ISSUER, users } from '#/db/schema'
import { hashPassword } from '../password'
import { withTenantCache } from '../tenant-data'
import { assertText, assignParentStudent, assignTeacherClasses } from './shared'
import { addUserSchema, updateUserSchema, deleteSchema } from './schemas'

export const addUser = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .validator(addUserSchema)
  .handler(({ data, context }) =>
    withTenantCache(async () => {
      assertText(data.name, 'Nama')
      assertText(data.email, 'Email')
      assertText(data.password, 'Kata sandi')

      const tenant = context.admin.tenant
      const passwordHash = await hashPassword(data.password)
      const [user] = await getDb()
        .insert(users)
        .values({
          schoolId: tenant.id,
          tenantSlug: tenant.slug,
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          role: data.role,
        })
        .returning({ id: users.id })

      await getDb()
        .insert(accounts)
        .values({
          id: `${user.id}:credential`,
          accountId: user.id,
          providerId: 'credential',
          issuer: CREDENTIAL_ISSUER,
          userId: user.id,
          password: passwordHash,
        })

      if (data.role === 'guru') {
        await assignTeacherClasses(tenant.id, user.id, data.classIds ?? [])
      }

      if (data.role === 'ortu') {
        await assignParentStudent(tenant.id, user.id, data.studentId)
      }
    }),
  )

export const updateUser = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .validator(updateUserSchema)
  .handler(({ data, context }) =>
    withTenantCache(async () => {
      assertText(data.name, 'Nama')
      assertText(data.email, 'Email')

      const tenant = context.admin.tenant
      const existingUser = await getDb().query.users.findFirst({
        where: and(
          eq(users.schoolId, tenant.id),
          eq(users.id, data.id),
          inArray(users.role, ['guru', 'ortu']),
        ),
      })

      if (!existingUser) {
        throw new Error('Data pengguna tidak ditemukan untuk sekolah ini.')
      }

      const role = data.role ?? existingUser.role

      const updatedUsers = await getDb()
        .update(users)
        .set({
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          role,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(users.schoolId, tenant.id),
            eq(users.id, data.id),
            inArray(users.role, ['guru', 'ortu']),
          ),
        )
        .returning({ id: users.id })

      if (!updatedUsers.at(0))
        throw new Error('Data pengguna tidak ditemukan untuk sekolah ini.')

      if (data.password?.trim()) {
        const passwordHash = await hashPassword(data.password)

        await getDb()
          .update(accounts)
          .set({ password: passwordHash, updatedAt: new Date() })
          .where(eq(accounts.userId, data.id))
      }

      if (role === 'guru') {
        await assignTeacherClasses(tenant.id, data.id, data.classIds ?? [])
      }

      if (role === 'ortu') {
        await assignParentStudent(tenant.id, data.id, data.studentId)
      }
    }),
  )

export const deleteUser = createServerFn({ method: 'POST' })
  .middleware([requireAdmin])
  .validator(deleteSchema)
  .handler(({ data, context }) =>
    withTenantCache(async () => {
      const tenant = context.admin.tenant
      await getDb()
        .delete(users)
        .where(
          and(
            eq(users.schoolId, tenant.id),
            eq(users.id, data.id),
            inArray(users.role, ['guru', 'ortu']),
          ),
        )
    }),
  )
