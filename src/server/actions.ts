import { createServerFn } from '@tanstack/react-start'
import { and, eq, inArray } from 'drizzle-orm'
import { getDb } from '#/db'
import {
  accounts,
  classes,
  dailyObservations,
  monthlySummaries,
  observationScores,
  schools,
  students,
  users,
  weeklyNotes,
} from '#/db/schema'
import type { Frequency, Gender, Indicator, Role } from '#/db/schema'
import { todayIso, weekStartIso } from './date'
import { hashPassword } from './password'
import { getTenantBySlug, withTenantCache } from './tenant-data'

type AddUserInput = {
  tenant?: string
  name: string
  email: string
  password: string
  role: Role
  classIds?: Array<string>
  studentId?: string
}

type UpdateUserInput = {
  tenant?: string
  id: string
  name: string
  email: string
  password?: string
  role?: Role
  classIds?: Array<string>
  studentId?: string
}

type AddClassInput = {
  tenant?: string
  name: string
  teacherId?: string
}

type UpdateClassInput = {
  tenant?: string
  id: string
  name: string
  teacherId?: string
}

type AddStudentInput = {
  tenant?: string
  nisn: string
  name: string
  classId: string
  gender: Gender
  parentId?: string
}

type UpdateStudentInput = {
  tenant?: string
  id: string
  nisn: string
  name: string
  classId: string
  gender: Gender
}

type BulkImportKind = 'teachers' | 'students' | 'parents'

type BulkImportInput = {
  tenant?: string
  kind: BulkImportKind
  rows: Array<Record<string, string>>
}

type DeleteInput = {
  tenant?: string
  id: string
}

type CreateSchoolInput = {
  name: string
  slug: string
  region: string
}

type CreateSchoolAdminInput = {
  schoolId: string
  name: string
  email: string
  password: string
}

type UpdateSchoolInput = {
  id: string
  name: string
  region: string
}

type UpdateSchoolAdminInput = {
  id: string
  schoolId: string
  name: string
  email: string
  password?: string
}

type SaveDailyObservationsInput = {
  tenant?: string
  classId: string
  observedAt?: string
  note?: string
  rows: Array<{
    studentId: string
    values: Record<Indicator, Frequency>
  }>
}

type SaveWeeklyNoteInput = {
  tenant?: string
  classId: string
  weekStart?: string
  p1: string
  p2: string
  p3: string
}

type SaveMonthlySummaryInput = {
  tenant?: string
  classId: string
  month: string
  text: string
}

function assertText(value: string, label: string) {
  if (!value.trim()) throw new Error(`${label} wajib diisi.`)
}

async function assertTenantOwnedUser(tenantId: string, id: string) {
  const user = await getDb().query.users.findFirst({
    where: and(eq(users.schoolId, tenantId), eq(users.id, id)),
  })
  if (!user) throw new Error('Data pengguna tidak ditemukan untuk sekolah ini.')
}

async function assertTenantOwnedClasses(tenantId: string, ids: Array<string>) {
  const uniqueIds = Array.from(new Set(ids))

  if (!uniqueIds.length) return []

  const rows = await getDb().query.classes.findMany({
    where: and(eq(classes.schoolId, tenantId), inArray(classes.id, uniqueIds)),
  })

  if (rows.length !== uniqueIds.length) {
    throw new Error('Sebagian kelas tidak ditemukan untuk sekolah ini.')
  }

  return uniqueIds
}

async function assertTeacherOwnsClass(
  tenantId: string,
  teacherId: string,
  classId: string,
) {
  assertText(classId, 'Kelas')

  const klass = await getDb().query.classes.findFirst({
    where: and(
      eq(classes.schoolId, tenantId),
      eq(classes.id, classId),
      eq(classes.teacherId, teacherId),
    ),
  })

  if (!klass) throw new Error('Kelas tidak ditugaskan ke guru ini.')
}

async function assignTeacherClasses(
  tenantId: string,
  teacherId: string,
  classIds: Array<string>,
) {
  const ownedClassIds = await assertTenantOwnedClasses(tenantId, classIds)

  await getDb()
    .update(classes)
    .set({ teacherId: null, updatedAt: new Date() })
    .where(
      and(eq(classes.schoolId, tenantId), eq(classes.teacherId, teacherId)),
    )

  if (ownedClassIds.length) {
    await getDb()
      .update(classes)
      .set({ teacherId, updatedAt: new Date() })
      .where(
        and(eq(classes.schoolId, tenantId), inArray(classes.id, ownedClassIds)),
      )
  }
}

async function assignParentStudent(
  tenantId: string,
  parentId: string,
  studentId?: string,
) {
  await getDb()
    .update(students)
    .set({ parentId: null, updatedAt: new Date() })
    .where(
      and(eq(students.schoolId, tenantId), eq(students.parentId, parentId)),
    )

  if (!studentId) return

  const student = await getDb().query.students.findFirst({
    where: and(eq(students.schoolId, tenantId), eq(students.id, studentId)),
  })

  if (!student) throw new Error('Siswa tidak ditemukan untuk sekolah ini.')

  await getDb()
    .update(students)
    .set({ parentId, updatedAt: new Date() })
    .where(and(eq(students.schoolId, tenantId), eq(students.id, studentId)))
}

function getRowValue(row: Record<string, string>, keys: Array<string>) {
  for (const key of keys) {
    const value = (row[key] ?? '').trim()
    if (value) return value
  }

  return ''
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function upsertCredentialAccount(userId: string, password?: string) {
  if (!password?.trim()) return

  const passwordHash = await hashPassword(password)

  await getDb()
    .insert(accounts)
    .values({
      id: `${userId}:credential`,
      accountId: userId,
      providerId: 'credential',
      userId,
      password: passwordHash,
    })
    .onConflictDoUpdate({
      target: accounts.id,
      set: { password: passwordHash, updatedAt: new Date() },
    })
}

async function upsertUserByEmail({
  tenantId,
  tenantSlug,
  name,
  email,
  password,
  role,
}: {
  tenantId: string
  tenantSlug: string
  name: string
  email: string
  password?: string
  role: Role
}) {
  const normalizedEmail = email.trim().toLowerCase()
  const [user] = await getDb()
    .insert(users)
    .values({
      schoolId: tenantId,
      tenantSlug,
      name: name.trim(),
      email: normalizedEmail,
      role,
    })
    .onConflictDoUpdate({
      target: [users.schoolId, users.email],
      set: {
        name: name.trim(),
        role,
        updatedAt: new Date(),
      },
    })
    .returning({ id: users.id })

  await upsertCredentialAccount(user.id, password)

  return user.id
}

async function findClassByName(tenantId: string, name: string) {
  if (!name.trim()) return null

  return getDb().query.classes.findFirst({
    where: and(eq(classes.schoolId, tenantId), eq(classes.name, name.trim())),
  })
}

async function findStudentByNisn(tenantId: string, nisn: string) {
  if (!nisn.trim()) return null

  return getDb().query.students.findFirst({
    where: and(eq(students.schoolId, tenantId), eq(students.nisn, nisn.trim())),
  })
}

async function resolveTenant(input?: { tenant?: string }) {
  if (input?.tenant) return getTenantBySlug(input.tenant)

  const { getSession } = await import('./auth.server')
  const session = await getSession()

  if (!session) {
    throw new Error('Silakan masuk terlebih dahulu.')
  }

  const user = await getDb().query.users.findFirst({
    where: eq(users.id, session.user.id),
  })

  if (!user) {
    throw new Error('Silakan masuk terlebih dahulu.')
  }

  return getTenantBySlug(user.tenantSlug)
}

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

export const createSchool = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateSchoolInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
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

export const createSchoolAdmin = createServerFn({ method: 'POST' })
  .inputValidator((data: CreateSchoolAdminInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
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

export const updateSchool = createServerFn({ method: 'POST' })
  .inputValidator((data: UpdateSchoolInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
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
      const { getAuthenticatedUserByRole } = await import('./auth.server')
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

export const updateSchoolAdmin = createServerFn({ method: 'POST' })
  .inputValidator((data: UpdateSchoolAdminInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
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
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      await getAuthenticatedUserByRole('super-admin')

      await getDb()
        .delete(users)
        .where(and(eq(users.id, data.id), eq(users.role, 'admin')))
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

export const bulkImportAdminRows = createServerFn({ method: 'POST' })
  .inputValidator((data: BulkImportInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const tenant = await resolveTenant(data)
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
            assertText(password, `Baris ${rowNumber}: kata sandi`)

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
            assertText(password, `Baris ${rowNumber}: kata sandi`)

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

export const addClass = createServerFn({ method: 'POST' })
  .inputValidator((data: AddClassInput) => data)
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
  .inputValidator((data: UpdateClassInput) => data)
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
  .inputValidator((data: DeleteInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const tenant = await resolveTenant(data)
      await getDb()
        .delete(classes)
        .where(and(eq(classes.schoolId, tenant.id), eq(classes.id, data.id)))
    }),
  )

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

export const saveDailyObservations = createServerFn({ method: 'POST' })
  .inputValidator((data: SaveDailyObservationsInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      const tenant = await resolveTenant(data)
      const teacher = await getAuthenticatedUserByRole('guru')
      const observedAt = data.observedAt ?? todayIso()
      const assignedClass = await getDb().query.classes.findFirst({
        where: and(
          eq(classes.schoolId, tenant.id),
          eq(classes.id, data.classId),
          eq(classes.teacherId, teacher.id),
        ),
      })

      if (!assignedClass) {
        throw new Error('Kelas tidak ditugaskan ke guru ini.')
      }

      const studentIds = data.rows.map((row) => row.studentId)
      const classStudents = await getDb().query.students.findMany({
        where: and(
          eq(students.schoolId, tenant.id),
          eq(students.classId, data.classId),
          inArray(students.id, studentIds),
        ),
      })
      const allowedStudentIds = new Set(
        classStudents.map((student) => student.id),
      )
      const validRows = data.rows.filter((row) =>
        allowedStudentIds.has(row.studentId),
      )

      if (!validRows.length) return

      const observations = await getDb()
        .insert(dailyObservations)
        .values(
          validRows.map((row) => ({
            schoolId: tenant.id,
            studentId: row.studentId,
            teacherId: teacher.id,
            observedAt,
            note: data.note?.trim() || null,
          })),
        )
        .onConflictDoUpdate({
          target: [dailyObservations.studentId, dailyObservations.observedAt],
          set: {
            teacherId: teacher.id,
            note: data.note?.trim() || null,
            updatedAt: new Date(),
          },
        })
        .returning({
          id: dailyObservations.id,
          studentId: dailyObservations.studentId,
        })

      const observationIds = observations.map((observation) => observation.id)
      const observationIdByStudent = new Map(
        observations.map((observation) => [
          observation.studentId,
          observation.id,
        ]),
      )
      const scores = validRows.flatMap((row) => {
        const observationId = observationIdByStudent.get(row.studentId)
        if (!observationId) return []
        return (
          Object.entries(row.values) as Array<[Indicator, Frequency]>
        ).map(([indicator, frequency]) => ({
          observationId,
          indicator,
          frequency,
        }))
      })

      if (observationIds.length) {
        await getDb()
          .delete(observationScores)
          .where(inArray(observationScores.observationId, observationIds))
      }

      if (scores.length) {
        await getDb().insert(observationScores).values(scores)
      }
    }),
  )

export const saveWeeklyNote = createServerFn({ method: 'POST' })
  .inputValidator((data: SaveWeeklyNoteInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      assertText(data.p1, 'P1')
      assertText(data.p2, 'P2')
      assertText(data.p3, 'P3')

      const tenant = await resolveTenant(data)
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      const teacher = await getAuthenticatedUserByRole('guru')
      await assertTeacherOwnsClass(tenant.id, teacher.id, data.classId)
      const weekStart = data.weekStart ?? weekStartIso()

      await getDb()
        .insert(weeklyNotes)
        .values({
          schoolId: tenant.id,
          teacherId: teacher.id,
          classId: data.classId,
          weekStart,
          p1: data.p1.trim(),
          p2: data.p2.trim(),
          p3: data.p3.trim(),
        })
        .onConflictDoUpdate({
          target: [
            weeklyNotes.schoolId,
            weeklyNotes.teacherId,
            weeklyNotes.classId,
            weeklyNotes.weekStart,
          ],
          set: {
            teacherId: teacher.id,
            p1: data.p1.trim(),
            p2: data.p2.trim(),
            p3: data.p3.trim(),
            updatedAt: new Date(),
          },
        })
    }),
  )

export const deleteWeeklyNote = createServerFn({ method: 'POST' })
  .inputValidator((data: DeleteInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const tenant = await resolveTenant(data)
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      const teacher = await getAuthenticatedUserByRole('guru')

      await getDb()
        .delete(weeklyNotes)
        .where(
          and(
            eq(weeklyNotes.schoolId, tenant.id),
            eq(weeklyNotes.id, data.id),
            eq(weeklyNotes.teacherId, teacher.id),
          ),
        )
    }),
  )

export const saveMonthlySummary = createServerFn({ method: 'POST' })
  .inputValidator((data: SaveMonthlySummaryInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      assertText(data.month, 'Bulan')
      assertText(data.text, 'Ringkasan')

      const tenant = await resolveTenant(data)
      const { getAuthenticatedUserByRole } = await import('./auth.server')
      const teacher = await getAuthenticatedUserByRole('guru')
      await assertTeacherOwnsClass(tenant.id, teacher.id, data.classId)
      const monthStart = `${data.month.slice(0, 7)}-01`

      await getDb()
        .insert(monthlySummaries)
        .values({
          schoolId: tenant.id,
          teacherId: teacher.id,
          classId: data.classId,
          monthStart,
          text: data.text.trim(),
        })
        .onConflictDoUpdate({
          target: [
            monthlySummaries.schoolId,
            monthlySummaries.teacherId,
            monthlySummaries.classId,
            monthlySummaries.monthStart,
          ],
          set: {
            teacherId: teacher.id,
            text: data.text.trim(),
            updatedAt: new Date(),
          },
        })
    }),
  )
