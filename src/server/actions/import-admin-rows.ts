import { and, eq, inArray, sql } from 'drizzle-orm'
import type { z } from 'zod'
import { getDb } from '#/db'
import {
  accounts,
  classes,
  CREDENTIAL_ISSUER,
  students,
  users,
} from '#/db/schema'
import type { Tenant } from '../tenant-data/types'
import { hashPassword } from '../password'
import type { bulkImportSchema } from './schemas'
import { assertText, getRowValue } from './shared'
import { emailSchema, optionalPasswordSchema, passwordSchema } from './schemas'

type Input = z.infer<typeof bulkImportSchema>
type StudentRow = {
  kind: 'students'
  rowNumber: number
  values: typeof students.$inferInsert
}
type UserRow = {
  kind: 'teachers' | 'parents'
  rowNumber: number
  values: typeof users.$inferInsert & { id: string }
  password: string
  targetIds: Array<string>
}
type ImportRow = StudentRow | UserRow

// Keep statement and parameter counts bounded for Neon HTTP transactions.
const batchSize = 50

export async function importAdminRows(tenant: Tenant, data: Input) {
  if (!data.rows.length) return { imported: 0, errors: [] }
  const db = getDb()
  const [classRows, studentRows, userRows] = await Promise.all([
    data.kind !== 'parents'
      ? db
          .select({ id: classes.id, name: classes.name })
          .from(classes)
          .where(eq(classes.schoolId, tenant.id))
      : Promise.resolve([]),
    data.kind === 'parents'
      ? db
          .select({ id: students.id, nisn: students.nisn })
          .from(students)
          .where(eq(students.schoolId, tenant.id))
      : Promise.resolve([]),
    data.kind !== 'students'
      ? db
          .select({ id: users.id, email: users.email, role: users.role })
          .from(users)
          .where(
            and(
              eq(users.schoolId, tenant.id),
              inArray(
                users.email,
                data.rows.map((row) =>
                  getRowValue(row, ['email']).toLowerCase(),
                ),
              ),
            ),
          )
      : Promise.resolve([]),
  ])
  const classIds = new Map(classRows.map((row) => [row.name, row.id]))
  const studentIds = new Map(studentRows.map((row) => [row.nisn, row.id]))
  const existingUsers = new Map(userRows.map((row) => [row.email, row]))
  const plannedUserIds = new Map(userRows.map((row) => [row.email, row.id]))
  const valid: Array<ImportRow> = []
  const failures: Array<{ rowNumber: number; message: string }> = []
  const fail = (rowNumber: number, error: unknown) =>
    failures.push({
      rowNumber,
      message: `Baris ${rowNumber}: ${error instanceof Error ? error.message : String(error)}`,
    })

  for (const [index, row] of data.rows.entries()) {
    const rowNumber = index + 2
    try {
      const name = getRowValue(row, ['name', 'nama'])
      assertText(name, 'Nama')
      if (data.kind === 'students') {
        const nisn = getRowValue(row, ['nisn'])
        const className = getRowValue(row, [
          'class_name',
          'kelas',
          'nama_kelas',
        ])
        const gender = getRowValue(row, ['gender', 'jenis_kelamin'])
        assertText(nisn, 'NISN')
        assertText(className, 'Kelas')
        if (gender !== 'L' && gender !== 'P')
          throw new Error('Jenis kelamin harus L atau P.')
        const classId = classIds.get(className)
        if (!classId) throw new Error(`Kelas "${className}" tidak ditemukan.`)
        valid.push({
          kind: 'students',
          rowNumber,
          values: { schoolId: tenant.id, classId, nisn, name, gender },
        })
        continue
      }
      const email = emailSchema.parse(getRowValue(row, ['email'])).toLowerCase()
      const password = getRowValue(row, ['password', 'kata_sandi'])
      if (data.mode === 'update') optionalPasswordSchema.parse(password)
      else passwordSchema.parse(password)
      const role = data.kind === 'teachers' ? 'guru' : 'ortu'
      const existing = existingUsers.get(email)
      if (existing && existing.role !== role)
        throw new Error(
          'Email sudah digunakan oleh pengguna dengan peran berbeda.',
        )
      const targetIds: Array<string> = []
      if (data.kind === 'teachers') {
        for (const className of getRowValue(row, [
          'class_names',
          'kelas',
          'nama_kelas',
        ])
          .split('|')
          .map((item) => item.trim())
          .filter(Boolean)) {
          const id = classIds.get(className)
          if (!id) throw new Error(`Kelas "${className}" tidak ditemukan.`)
          targetIds.push(id)
        }
      } else {
        const nisn = getRowValue(row, ['student_nisn', 'nisn_siswa', 'nisn'])
        if (nisn) {
          const id = studentIds.get(nisn)
          if (!id) throw new Error(`Siswa NISN "${nisn}" tidak ditemukan.`)
          targetIds.push(id)
        }
      }
      const id = plannedUserIds.get(email) ?? crypto.randomUUID()
      plannedUserIds.set(email, id)
      valid.push({
        kind: data.kind,
        rowNumber,
        values: {
          id,
          schoolId: tenant.id,
          tenantSlug: tenant.slug,
          name,
          email,
          role,
        },
        password,
        targetIds: [...new Set(targetIds)],
      })
    } catch (error) {
      fail(rowNumber, error)
    }
  }

  let imported = 0
  for (let offset = 0; offset < valid.length; offset += batchSize) {
    const chunk = valid.slice(offset, offset + batchSize)
    // Hash before opening the transaction. Each row's writes commit together.
    const prepared = []
    for (const row of chunk) {
      try {
        prepared.push({
          row,
          passwordHash:
            row.kind !== 'students' && row.password
              ? await hashPassword(row.password)
              : null,
        })
      } catch (error) {
        fail(row.rowNumber, error)
      }
    }
    // PostgreSQL cannot upsert the same NISN twice in one statement.
    // Retain the last valid row, matching the original ordered import.
    const studentValues = new Map<string, typeof students.$inferInsert>()
    for (const { row } of prepared) {
      if (row.kind === 'students')
        studentValues.set(row.values.nisn, row.values)
    }
    const studentWrites = studentValues.size
      ? [
          db
            .insert(students)
            .values([...studentValues.values()])
            .onConflictDoUpdate({
              target: [students.schoolId, students.nisn],
              set: {
                classId: sql`excluded.class_id`,
                name: sql`excluded.name`,
                gender: sql`excluded.gender`,
                updatedAt: new Date(),
              },
            }),
        ]
      : []
    const statements = prepared.map(({ row, passwordHash }) => {
      if (row.kind === 'students') return []
      const id = row.values.id
      // Match the preloaded identity as well as the role. Concurrent inserts or
      // role changes fail the transaction rather than claiming another account.
      const userWrite = db
        .insert(users)
        .values(row.values)
        .onConflictDoUpdate({
          target: [users.schoolId, users.email],
          set: {
            name: sql`case when ${users.id} = ${id} and ${users.role} = ${row.values.role} then excluded.name else null end`,
            updatedAt: new Date(),
          },
        })
      const credentialWrites = passwordHash
        ? [
            db
              .insert(accounts)
              .values({
                id: `${id}:credential`,
                accountId: id,
                providerId: 'credential',
                issuer: CREDENTIAL_ISSUER,
                userId: id,
                password: passwordHash,
              })
              .onConflictDoUpdate({
                target: accounts.id,
                set: { password: passwordHash, updatedAt: new Date() },
              }),
          ]
        : []
      if (row.kind === 'teachers')
        return [
          userWrite,
          ...credentialWrites,
          db
            .update(classes)
            .set({ teacherId: null, updatedAt: new Date() })
            .where(
              and(eq(classes.schoolId, tenant.id), eq(classes.teacherId, id)),
            ),
          ...(row.targetIds.length
            ? [
                db
                  .update(classes)
                  .set({ teacherId: id, updatedAt: new Date() })
                  .where(
                    and(
                      eq(classes.schoolId, tenant.id),
                      inArray(classes.id, row.targetIds),
                    ),
                  ),
              ]
            : []),
        ]
      return [
        userWrite,
        ...credentialWrites,
        db
          .update(students)
          .set({ parentId: null, updatedAt: new Date() })
          .where(
            and(eq(students.schoolId, tenant.id), eq(students.parentId, id)),
          ),
        ...(row.targetIds.length
          ? [
              db
                .update(students)
                .set({ parentId: id, updatedAt: new Date() })
                .where(
                  and(
                    eq(students.schoolId, tenant.id),
                    inArray(students.id, row.targetIds),
                  ),
                ),
            ]
          : []),
      ]
    })
    const queries = [...studentWrites, ...statements.flat()]
    const first = queries.at(0)
    const rest = queries.slice(1)
    if (!first) continue
    try {
      await db.batch([first, ...rest])
      imported += prepared.length
    } catch {
      for (const { row } of prepared)
        fail(
          row.rowNumber,
          new Error('Batch gagal disimpan. Muat ulang data dan coba lagi.'),
        )
    }
  }
  return {
    imported,
    errors: failures
      .sort((a, b) => a.rowNumber - b.rowNumber)
      .map((item) => item.message),
  }
}
