import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import { eq } from 'drizzle-orm'
import {
  accounts,
  classes,
  dailyObservations,
  observationScores,
  schools,
  students,
  users,
  weeklyNotes,
} from './schema'
import {
  classes as mockClasses,
  dailyObservations as mockObservations,
  students as mockStudents,
  tenants,
  users as mockUsers,
  weeklyNotes as mockWeeklyNotes,
} from '#/data'

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the database.')
}

const db = drizzle(neon(databaseUrl))
const defaultPasswordHash =
  'scrypt$habits-plus-demo$22282b6e7bca88a780f9c3b0cb8ec38b5ad77a338e3cca261594999de1fed2594f175d274f8cc4a7eef69b428ea49d386e536c4dcfeaa689efe12ff39194d6db'

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
      password: defaultPasswordHash,
    })
    .onConflictDoUpdate({
      target: accounts.id,
      set: { password: defaultPasswordHash, updatedAt: new Date() },
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
  for (const row of mockObservations) {
    const studentId = studentIds.get(row.studentId)
    if (!studentId) continue

    const [observation] = await db
      .insert(dailyObservations)
      .values({
        schoolId: demoSchoolId,
        studentId,
        teacherId,
        observedAt: '2026-01-12',
      })
      .onConflictDoUpdate({
        target: [dailyObservations.studentId, dailyObservations.observedAt],
        set: { teacherId, updatedAt: new Date() },
      })
      .returning({ id: dailyObservations.id })

    await db
      .delete(observationScores)
      .where(eq(observationScores.observationId, observation.id))

    await db.insert(observationScores).values(
      Object.entries(row.values).map(([indicator, frequency]) => ({
        observationId: observation.id,
        indicator: indicator as keyof typeof row.values,
        frequency,
      })),
    )
  }

  for (const note of mockWeeklyNotes) {
    await db
      .insert(weeklyNotes)
      .values({
        schoolId: demoSchoolId,
        teacherId,
        weekStart: note.date,
        p1: note.p1,
        p2: note.p2,
        p3: note.p3,
      })
      .onConflictDoUpdate({
        target: [weeklyNotes.schoolId, weeklyNotes.weekStart],
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

console.log('Seeded Habits+ demo data.')
