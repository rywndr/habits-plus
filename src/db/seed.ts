import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { and, eq, isNull } from 'drizzle-orm'
import {
  accounts,
  classes,
  dailyObservations,
  observationScores,
  schools,
  scoreFrequency,
  students,
  users,
  weeklyNotes,
} from './schema'
import {
  classes as mockClasses,
  students as mockStudents,
  tenants,
  users as mockUsers,
  weeklyNotes as mockWeeklyNotes,
} from '#/data'
import { hashPassword } from '#/server/password'
import type { Indicator } from './schema'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the database.')
}

const db = drizzle(neon(databaseUrl))
// All seeded accounts share one known password so the demo users can log in.
const seedPassword = 'password'
const passwordHash = await hashPassword(seedPassword)

const schoolIds = new Map<string, string>()
const userIds = new Map<string, string>()
const classIds = new Map<string, string>()
const studentIds = new Map<string, string>()

for (const tenant of tenants) {
  const [school] = await db
    .insert(schools)
    .values({
      slug: tenant.slug,
      name: tenant.name,
      region: tenant.region,
    })
    .onConflictDoUpdate({
      target: schools.slug,
      set: { name: tenant.name, region: tenant.region, updatedAt: new Date() },
    })
    .returning({ id: schools.id })

  schoolIds.set(tenant.slug, school.id)
}

for (const user of mockUsers) {
  const schoolId = schoolIds.get(user.tenantSlug)
  if (!schoolId) continue

  const [created] = await db
    .insert(users)
    .values({
      schoolId,
      tenantSlug: user.tenantSlug,
      name: user.name,
      email: user.email,
      role: user.role,
    })
    .onConflictDoUpdate({
      target: [users.schoolId, users.email],
      set: {
        tenantSlug: user.tenantSlug,
        name: user.name,
        role: user.role,
        updatedAt: new Date(),
      },
    })
    .returning({ id: users.id })

  userIds.set(user.id, created.id)

  await db
    .insert(accounts)
    .values({
      id: `${created.id}:credential`,
      accountId: created.id,
      providerId: 'credential',
      userId: created.id,
      password: passwordHash,
    })
    .onConflictDoUpdate({
      target: accounts.id,
      set: { password: passwordHash, updatedAt: new Date() },
    })
}

for (const klass of mockClasses) {
  const schoolId = schoolIds.get(klass.tenantSlug)
  if (!schoolId) continue

  const [created] = await db
    .insert(classes)
    .values({
      schoolId,
      teacherId: userIds.get(klass.teacherId),
      name: klass.name,
    })
    .onConflictDoUpdate({
      target: [classes.schoolId, classes.name],
      set: { teacherId: userIds.get(klass.teacherId), updatedAt: new Date() },
    })
    .returning({ id: classes.id })

  classIds.set(klass.id, created.id)
}

for (const student of mockStudents) {
  const classId = classIds.get(student.classId)
  const schoolId = schoolIds.get('demo')
  if (!classId || !schoolId) continue

  const [created] = await db
    .insert(students)
    .values({
      schoolId,
      classId,
      parentId: student.parentId ? userIds.get(student.parentId) : undefined,
      nisn: student.nisn,
      name: student.name,
      gender: student.gender,
    })
    .onConflictDoUpdate({
      target: [students.schoolId, students.nisn],
      set: {
        classId,
        parentId: student.parentId ? userIds.get(student.parentId) : null,
        name: student.name,
        gender: student.gender,
        updatedAt: new Date(),
      },
    })
    .returning({ id: students.id })

  studentIds.set(student.id, created.id)
}

const teacherId = userIds.get('u-guru-1')
const demoSchoolId = schoolIds.get('demo')

if (teacherId && demoSchoolId) {
  // One observation date per week of the current month (mid-bucket days, so the
  // day-of-month -> week mapping in getMonthlySummary is unambiguous).
  const observationDates = [
    '2026-05-04', // Minggu ke-1
    '2026-05-11', // Minggu ke-2
    '2026-05-18', // Minggu ke-3
    '2026-05-25', // Minggu ke-4
  ]
  // Target weekly average score (0..2) per indicator, one per week above.
  // Chosen to give four visually distinct radar polygons and varied trends.
  const weeklyTargets: Record<Indicator, Array<number>> = {
    respons: [0.6, 1.0, 1.4, 1.8], // steadily improving
    interaksi: [1.7, 1.8, 1.6, 1.9], // consistently high
    partisipasi: [1.0, 1.1, 1.3, 1.4], // gentle rise
    regulasi: [1.2, 0.8, 1.0, 1.5], // dip, then recover
  }
  const indicators = Object.keys(weeklyTargets) as Array<Indicator>
  const demoStudentIds = [...studentIds.values()]

  // Distribute `n` integer scores (0|1|2) that average to `target`.
  const scoresForAverage = (target: number, n: number): Array<number> => {
    const total = Math.max(0, Math.min(2 * n, Math.round(target * n)))
    const base = Math.floor(total / n)
    const remainder = total - base * n
    return Array.from({ length: n }, (_, i) =>
      i < remainder ? base + 1 : base,
    )
  }

  for (let week = 0; week < observationDates.length; week++) {
    const observedAt = observationDates[week]
    const scoresByIndicator = Object.fromEntries(
      indicators.map((indicator) => [
        indicator,
        scoresForAverage(weeklyTargets[indicator][week], demoStudentIds.length),
      ]),
    ) as Record<Indicator, Array<number>>

    for (let i = 0; i < demoStudentIds.length; i++) {
      const studentId = demoStudentIds[i]

      const [observation] = await db
        .insert(dailyObservations)
        .values({ schoolId: demoSchoolId, studentId, teacherId, observedAt })
        .onConflictDoUpdate({
          target: [dailyObservations.studentId, dailyObservations.observedAt],
          set: { teacherId, updatedAt: new Date() },
        })
        .returning({ id: dailyObservations.id })

      await db
        .delete(observationScores)
        .where(eq(observationScores.observationId, observation.id))

      await db.insert(observationScores).values(
        indicators.map((indicator) => ({
          observationId: observation.id,
          indicator,
          frequency: scoreFrequency[scoresByIndicator[indicator][i]],
        })),
      )
    }
  }

  // Weekly notes are per class; seed them against the class that has students.
  const notesClassId = classIds.get('c-2')

  // Drop any legacy class-less notes from earlier seeds so the per-class views
  // don't show orphan rows.
  await db
    .delete(weeklyNotes)
    .where(
      and(eq(weeklyNotes.schoolId, demoSchoolId), isNull(weeklyNotes.classId)),
    )

  if (notesClassId) {
    for (const note of mockWeeklyNotes) {
      await db
        .insert(weeklyNotes)
        .values({
          schoolId: demoSchoolId,
          teacherId,
          classId: notesClassId,
          weekStart: note.date,
          p1: note.p1,
          p2: note.p2,
          p3: note.p3,
        })
        .onConflictDoUpdate({
          target: [
            weeklyNotes.schoolId,
            weeklyNotes.teacherId,
            weeklyNotes.classId,
            weeklyNotes.weekStart,
          ],
          set: {
            teacherId,
            p1: note.p1,
            p2: note.p2,
            p3: note.p3,
            updatedAt: new Date(),
          },
        })
    }
  }
}

console.log('Seeded Habits+ demo data.')
