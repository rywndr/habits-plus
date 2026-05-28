import { and, eq, inArray } from 'drizzle-orm'
import { getDb } from '#/db'
import { accounts, classes, students, users } from '#/db/schema'
import type { Role } from '#/db/schema'
import { hashPassword } from '../password'
import { getTenantBySlug } from '../tenant-data'

export function assertText(value: string, label: string) {
  if (!value.trim()) throw new Error(`${label} wajib diisi.`)
}

export async function assertTenantOwnedUser(tenantId: string, id: string) {
  const user = await getDb().query.users.findFirst({
    where: and(eq(users.schoolId, tenantId), eq(users.id, id)),
  })
  if (!user) throw new Error('Data pengguna tidak ditemukan untuk sekolah ini.')
}

export async function assertTenantOwnedClasses(
  tenantId: string,
  ids: Array<string>,
) {
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

export async function assertTeacherOwnsClass(
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

export async function assignTeacherClasses(
  tenantId: string,
  teacherId: string,
  classIds: Array<string>,
) {
  const ownedClassIds = await assertTenantOwnedClasses(tenantId, classIds)

  await getDb()
    .update(classes)
    .set({ teacherId: null, updatedAt: new Date() })
    .where(and(eq(classes.schoolId, tenantId), eq(classes.teacherId, teacherId)))

  if (ownedClassIds.length) {
    await getDb()
      .update(classes)
      .set({ teacherId, updatedAt: new Date() })
      .where(
        and(eq(classes.schoolId, tenantId), inArray(classes.id, ownedClassIds)),
      )
  }
}

export async function assignParentStudent(
  tenantId: string,
  parentId: string,
  studentId?: string,
) {
  await getDb()
    .update(students)
    .set({ parentId: null, updatedAt: new Date() })
    .where(and(eq(students.schoolId, tenantId), eq(students.parentId, parentId)))

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

export function getRowValue(row: Record<string, string>, keys: Array<string>) {
  for (const key of keys) {
    const value = (row[key] ?? '').trim()
    if (value) return value
  }

  return ''
}

export function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function upsertCredentialAccount(
  userId: string,
  password?: string,
) {
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

export async function upsertUserByEmail(input: {
  tenantId: string
  tenantSlug: string
  name: string
  email: string
  password?: string
  role: Role
}) {
  const [user] = await getDb()
    .insert(users)
    .values({
      schoolId: input.tenantId,
      tenantSlug: input.tenantSlug,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      role: input.role,
    })
    .onConflictDoUpdate({
      target: [users.schoolId, users.email],
      set: {
        name: input.name.trim(),
        role: input.role,
        updatedAt: new Date(),
      },
    })
    .returning({ id: users.id })

  await upsertCredentialAccount(user.id, input.password)

  return user.id
}

export async function findClassByName(tenantId: string, name: string) {
  if (!name.trim()) return null

  return getDb().query.classes.findFirst({
    where: and(eq(classes.schoolId, tenantId), eq(classes.name, name.trim())),
  })
}

export async function findStudentByNisn(tenantId: string, nisn: string) {
  if (!nisn.trim()) return null

  return getDb().query.students.findFirst({
    where: and(eq(students.schoolId, tenantId), eq(students.nisn, nisn.trim())),
  })
}

export async function resolveTenant(input?: { tenant?: string }) {
  if (input?.tenant) return getTenantBySlug(input.tenant)

  const { getSession } = await import('../auth.server')
  const session = await getSession()

  if (!session) throw new Error('Silakan masuk terlebih dahulu.')

  const user = await getDb().query.users.findFirst({
    where: eq(users.id, session.user.id),
  })

  if (!user) throw new Error('Silakan masuk terlebih dahulu.')

  return getTenantBySlug(user.tenantSlug)
}
