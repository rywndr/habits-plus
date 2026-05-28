import { createServerFn } from '@tanstack/react-start'
import { getDb } from '#/db'
import { students } from '#/db/schema'
import { withTenantCache } from '../tenant-data'
import {
  assertText,
  assignParentStudent,
  assignTeacherClasses,
  findClassByName,
  findStudentByNisn,
  getRowValue,
  resolveTenant,
  upsertUserByEmail,
} from './shared'
import type { BulkImportInput } from './types'

export const bulkImportAdminRows = createServerFn({ method: 'POST' })
  .inputValidator((data: BulkImportInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const tenant = await resolveTenant(data)
      const isUpdate = data.mode === 'update'
      let imported = 0
      const errors: Array<string> = []

      for (const [index, row] of data.rows.entries()) {
        const rowNumber = index + 2

        try {
          if (data.kind === 'teachers') {
            const name = getRowValue(row, ['name', 'nama'])
            const email = getRowValue(row, ['email'])
            const password = getRowValue(row, ['password', 'kata_sandi'])
            const classNames = getRowValue(row, [
              'class_names',
              'kelas',
              'nama_kelas',
            ])

            assertText(name, `Baris ${rowNumber}: nama`)
            assertText(email, `Baris ${rowNumber}: email`)
            if (!isUpdate) {
              assertText(password, `Baris ${rowNumber}: kata sandi`)
            }

            const teacherId = await upsertUserByEmail({
              tenantId: tenant.id,
              tenantSlug: tenant.slug,
              name,
              email,
              password,
              role: 'guru',
            })
            const classIds: Array<string> = []

            for (const className of classNames
              .split('|')
              .map((item) => item.trim())
              .filter(Boolean)) {
              const klass = await findClassByName(tenant.id, className)
              if (!klass) {
                throw new Error(
                  `Baris ${rowNumber}: kelas "${className}" tidak ditemukan.`,
                )
              }
              classIds.push(klass.id)
            }

            await assignTeacherClasses(tenant.id, teacherId, classIds)
            imported += 1
          } else if (data.kind === 'students') {
            const nisn = getRowValue(row, ['nisn'])
            const name = getRowValue(row, ['name', 'nama'])
            const className = getRowValue(row, [
              'class_name',
              'kelas',
              'nama_kelas',
            ])
            const gender = getRowValue(row, ['gender', 'jenis_kelamin'])

            assertText(nisn, `Baris ${rowNumber}: NISN`)
            assertText(name, `Baris ${rowNumber}: nama`)
            assertText(className, `Baris ${rowNumber}: kelas`)

            if (gender !== 'L' && gender !== 'P') {
              throw new Error(
                `Baris ${rowNumber}: jenis kelamin harus L atau P.`,
              )
            }

            const klass = await findClassByName(tenant.id, className)
            if (!klass) {
              throw new Error(
                `Baris ${rowNumber}: kelas "${className}" tidak ditemukan.`,
              )
            }

            await getDb()
              .insert(students)
              .values({
                schoolId: tenant.id,
                classId: klass.id,
                nisn: nisn.trim(),
                name: name.trim(),
                gender,
              })
              .onConflictDoUpdate({
                target: [students.schoolId, students.nisn],
                set: {
                  classId: klass.id,
                  name: name.trim(),
                  gender,
                  updatedAt: new Date(),
                },
              })

            imported += 1
          } else {
            const name = getRowValue(row, ['name', 'nama'])
            const email = getRowValue(row, ['email'])
            const password = getRowValue(row, ['password', 'kata_sandi'])
            const studentNisn = getRowValue(row, [
              'student_nisn',
              'nisn_siswa',
              'nisn',
            ])

            assertText(name, `Baris ${rowNumber}: nama`)
            assertText(email, `Baris ${rowNumber}: email`)
            if (!isUpdate) {
              assertText(password, `Baris ${rowNumber}: kata sandi`)
            }

            const parentId = await upsertUserByEmail({
              tenantId: tenant.id,
              tenantSlug: tenant.slug,
              name,
              email,
              password,
              role: 'ortu',
            })
            const student = studentNisn
              ? await findStudentByNisn(tenant.id, studentNisn)
              : null

            if (studentNisn && !student) {
              throw new Error(
                `Baris ${rowNumber}: siswa NISN "${studentNisn}" tidak ditemukan.`,
              )
            }

            await assignParentStudent(tenant.id, parentId, student?.id)
            imported += 1
          }
        } catch (error) {
          errors.push(error instanceof Error ? error.message : String(error))
        }
      }

      return { imported, errors }
    }),
  )
