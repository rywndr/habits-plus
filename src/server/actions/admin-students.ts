import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { getDb } from '#/db'
import { classes, students } from '#/db/schema'
import { withTenantCache } from '../tenant-data'
import {
  assertTenantOwnedUser,
  assertText,
  resolveTenant,
} from './shared'
import type { AddStudentInput, DeleteInput, UpdateStudentInput } from './types'

export const addStudent = createServerFn({ method: 'POST' })
  .inputValidator((data: AddStudentInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      assertText(data.nisn, 'NISN')
      assertText(data.name, 'Nama')

      const tenant = await resolveTenant(data)
      const klass = await getDb().query.classes.findFirst({
        where: and(
          eq(classes.schoolId, tenant.id),
          eq(classes.id, data.classId),
        ),
      })

      if (!klass) throw new Error('Kelas tidak ditemukan untuk sekolah ini.')
      if (data.parentId) await assertTenantOwnedUser(tenant.id, data.parentId)

      await getDb()
        .insert(students)
        .values({
          schoolId: tenant.id,
          classId: data.classId,
          parentId: data.parentId || null,
          nisn: data.nisn.trim(),
          name: data.name.trim(),
          gender: data.gender,
        })
    }),
  )

export const updateStudent = createServerFn({ method: 'POST' })
  .inputValidator((data: UpdateStudentInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      assertText(data.nisn, 'NISN')
      assertText(data.name, 'Nama')

      const tenant = await resolveTenant(data)
      const [student, klass] = await Promise.all([
        getDb().query.students.findFirst({
          where: and(
            eq(students.schoolId, tenant.id),
            eq(students.id, data.id),
          ),
        }),
        getDb().query.classes.findFirst({
          where: and(
            eq(classes.schoolId, tenant.id),
            eq(classes.id, data.classId),
          ),
        }),
      ])

      if (!student) throw new Error('Siswa tidak ditemukan untuk sekolah ini.')
      if (!klass) throw new Error('Kelas tidak ditemukan untuk sekolah ini.')

      await getDb()
        .update(students)
        .set({
          nisn: data.nisn.trim(),
          name: data.name.trim(),
          classId: data.classId,
          gender: data.gender,
          updatedAt: new Date(),
        })
        .where(and(eq(students.schoolId, tenant.id), eq(students.id, data.id)))
    }),
  )

export const deleteStudent = createServerFn({ method: 'POST' })
  .inputValidator((data: DeleteInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const tenant = await resolveTenant(data)
      await getDb()
        .delete(students)
        .where(and(eq(students.schoolId, tenant.id), eq(students.id, data.id)))
    }),
  )
