import { createServerFn } from '@tanstack/react-start'
import { and, eq, inArray } from 'drizzle-orm'
import { getDb } from '#/db'
import {
  accounts,
  classes,
  dailyObservations,
  observationScores,
  students,
  users,
  weeklyNotes,
} from '#/db/schema'
import type { Frequency, Gender, Indicator, Role } from '#/db/schema'
import { todayIso, weekStartIso } from './date'
import { hashPassword } from './password'
import { getTenantBySlug } from './tenant-data'

type AddUserInput = {
  tenant: string
  name: string
  email: string
  password: string
  role: Role
}

type AddClassInput = {
  tenant: string
  name: string
  teacherId?: string
}

type AddStudentInput = {
  tenant: string
  nisn: string
  name: string
  classId: string
  gender: Gender
  parentId?: string
}

type DeleteInput = {
  tenant: string
  id: string
}

type SaveDailyObservationsInput = {
  tenant: string
  classId: string
  observedAt?: string
  note?: string
  rows: Array<{
    studentId: string
    values: Record<Indicator, Frequency>
  }>
}

type SaveWeeklyNoteInput = {
  tenant: string
  weekStart?: string
  p1: string
  p2: string
  p3: string
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

export const addUser = createServerFn({ method: 'POST' })
  .inputValidator((data: AddUserInput) => data)
  .handler(async ({ data }) => {
    assertText(data.name, 'Nama')
    assertText(data.email, 'Email')
    assertText(data.password, 'Kata sandi')

    const tenant = await getTenantBySlug(data.tenant)
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

    await getDb().insert(accounts).values({
      id: `${user.id}:credential`,
      accountId: user.id,
      providerId: 'credential',
      userId: user.id,
      password: passwordHash,
    })
  })

export const deleteUser = createServerFn({ method: 'POST' })
  .inputValidator((data: DeleteInput) => data)
  .handler(async ({ data }) => {
    const tenant = await getTenantBySlug(data.tenant)
    await getDb()
      .delete(users)
      .where(and(eq(users.schoolId, tenant.id), eq(users.id, data.id)))
  })

export const addClass = createServerFn({ method: 'POST' })
  .inputValidator((data: AddClassInput) => data)
  .handler(async ({ data }) => {
    assertText(data.name, 'Nama kelas')
    const tenant = await getTenantBySlug(data.tenant)

    if (data.teacherId) await assertTenantOwnedUser(tenant.id, data.teacherId)

    await getDb()
      .insert(classes)
      .values({
        schoolId: tenant.id,
        name: data.name.trim(),
        teacherId: data.teacherId || null,
      })
  })

export const deleteClass = createServerFn({ method: 'POST' })
  .inputValidator((data: DeleteInput) => data)
  .handler(async ({ data }) => {
    const tenant = await getTenantBySlug(data.tenant)
    await getDb()
      .delete(classes)
      .where(and(eq(classes.schoolId, tenant.id), eq(classes.id, data.id)))
  })

export const addStudent = createServerFn({ method: 'POST' })
  .inputValidator((data: AddStudentInput) => data)
  .handler(async ({ data }) => {
    assertText(data.nisn, 'NISN')
    assertText(data.name, 'Nama')

    const tenant = await getTenantBySlug(data.tenant)
    const klass = await getDb().query.classes.findFirst({
      where: and(eq(classes.schoolId, tenant.id), eq(classes.id, data.classId)),
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
  })

export const deleteStudent = createServerFn({ method: 'POST' })
  .inputValidator((data: DeleteInput) => data)
  .handler(async ({ data }) => {
    const tenant = await getTenantBySlug(data.tenant)
    await getDb()
      .delete(students)
      .where(and(eq(students.schoolId, tenant.id), eq(students.id, data.id)))
  })

export const saveDailyObservations = createServerFn({ method: 'POST' })
  .inputValidator((data: SaveDailyObservationsInput) => data)
  .handler(async ({ data }) => {
    const { getAuthenticatedUser } = await import('./auth.server')
    const tenant = await getTenantBySlug(data.tenant)
    const teacher = await getAuthenticatedUser(data.tenant, 'guru')
    const observedAt = data.observedAt ?? todayIso()
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

    for (const row of data.rows) {
      if (!allowedStudentIds.has(row.studentId)) continue

      const [observation] = await getDb()
        .insert(dailyObservations)
        .values({
          schoolId: tenant.id,
          studentId: row.studentId,
          teacherId: teacher.id,
          observedAt,
          note: data.note?.trim() || null,
        })
        .onConflictDoUpdate({
          target: [dailyObservations.studentId, dailyObservations.observedAt],
          set: {
            teacherId: teacher.id,
            note: data.note?.trim() || null,
            updatedAt: new Date(),
          },
        })
        .returning({ id: dailyObservations.id })

      await getDb()
        .delete(observationScores)
        .where(eq(observationScores.observationId, observation.id))

      await getDb()
        .insert(observationScores)
        .values(
          (Object.entries(row.values) as Array<[Indicator, Frequency]>).map(
            ([indicator, frequency]) => ({
              observationId: observation.id,
              indicator,
              frequency,
            }),
          ),
        )
    }
  })

export const saveWeeklyNote = createServerFn({ method: 'POST' })
  .inputValidator((data: SaveWeeklyNoteInput) => data)
  .handler(async ({ data }) => {
    assertText(data.p1, 'P1')
    assertText(data.p2, 'P2')
    assertText(data.p3, 'P3')

    const tenant = await getTenantBySlug(data.tenant)
    const { getAuthenticatedUser } = await import('./auth.server')
    const teacher = await getAuthenticatedUser(data.tenant, 'guru')
    const weekStart = data.weekStart ?? weekStartIso()

    await getDb()
      .insert(weeklyNotes)
      .values({
        schoolId: tenant.id,
        teacherId: teacher.id,
        weekStart,
        p1: data.p1.trim(),
        p2: data.p2.trim(),
        p3: data.p3.trim(),
      })
      .onConflictDoUpdate({
        target: [weeklyNotes.schoolId, weeklyNotes.weekStart],
        set: {
          teacherId: teacher.id,
          p1: data.p1.trim(),
          p2: data.p2.trim(),
          p3: data.p3.trim(),
          updatedAt: new Date(),
        },
      })
  })
