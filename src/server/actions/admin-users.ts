import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { getDb } from '#/db'
import { accounts, users } from '#/db/schema'
import { hashPassword } from '../password'
import { withTenantCache } from '../tenant-data'
import {
  assertText,
  assignParentStudent,
  assignTeacherClasses,
  resolveTenant,
} from './shared'
import type { AddUserInput, DeleteInput, UpdateUserInput } from './types'

export const addUser = createServerFn({ method: 'POST' })
  .inputValidator((data: AddUserInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      assertText(data.name, 'Nama')
      assertText(data.email, 'Email')
      assertText(data.password, 'Kata sandi')

      const tenant = await resolveTenant(data)
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
  .inputValidator((data: UpdateUserInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      assertText(data.name, 'Nama')
      assertText(data.email, 'Email')

      const tenant = await resolveTenant(data)
      const existingUser = await getDb().query.users.findFirst({
        where: and(eq(users.schoolId, tenant.id), eq(users.id, data.id)),
      })

      if (!existingUser) {
        throw new Error('Data pengguna tidak ditemukan untuk sekolah ini.')
      }

      const role = data.role ?? existingUser.role

      await getDb()
        .update(users)
        .set({
          name: data.name.trim(),
          email: data.email.trim().toLowerCase(),
          role,
          updatedAt: new Date(),
        })
        .where(and(eq(users.schoolId, tenant.id), eq(users.id, data.id)))

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
  .inputValidator((data: DeleteInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const tenant = await resolveTenant(data)
      await getDb()
        .delete(users)
        .where(and(eq(users.schoolId, tenant.id), eq(users.id, data.id)))
    }),
  )
