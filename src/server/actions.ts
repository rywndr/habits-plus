import { createServerFn } from '@tanstack/react-start'
import { and, eq, inArray } from 'drizzle-orm'
import { getDb } from '#/db'
import {
  accounts,
  classes,
  dailyObservations,
  monthlySummaries,
  observationScores,
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
}

type AddClassInput = {
  tenant?: string
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

type DeleteInput = {
  tenant?: string
  id: string
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
  weekStart?: string
  p1: string
  p2: string
  p3: string
}

type SaveMonthlySummaryInput = {
  tenant?: string
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
    }),
  )

export const deleteWeeklyNote = createServerFn({ method: 'POST' })
  .inputValidator((data: DeleteInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const tenant = await resolveTenant(data)
      await getDb()
        .delete(weeklyNotes)
        .where(
          and(eq(weeklyNotes.schoolId, tenant.id), eq(weeklyNotes.id, data.id)),
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
      const monthStart = `${data.month.slice(0, 7)}-01`

      await getDb()
        .insert(monthlySummaries)
        .values({
          schoolId: tenant.id,
          teacherId: teacher.id,
          monthStart,
          text: data.text.trim(),
        })
        .onConflictDoUpdate({
          target: [monthlySummaries.schoolId, monthlySummaries.monthStart],
          set: {
            teacherId: teacher.id,
            text: data.text.trim(),
            updatedAt: new Date(),
          },
        })
    }),
  )
