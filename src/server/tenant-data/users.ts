import { and, asc, eq, inArray } from 'drizzle-orm'
import { getDb } from '#/db'
import { students, users } from '#/db/schema'
import { MissingTenantRoleError } from '#/lib/app-errors'
import { getTenantBySlug } from './tenants'
import type { AppUser, Role } from './types'

export async function getTenantUsers(slug: string): Promise<Array<AppUser>> {
  const tenant = await getTenantBySlug(slug)
  const rows = await getDb().query.users.findMany({
    where: eq(users.schoolId, tenant.id),
    orderBy: [asc(users.name)],
  })
  const parentIds = rows.filter((u) => u.role === 'ortu').map((u) => u.id)
  const linkedStudents = parentIds.length
    ? await getDb().query.students.findMany({
        where: inArray(students.parentId, parentIds),
      })
    : []

  return rows.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantSlug: slug,
    studentId: linkedStudents.find((s) => s.parentId === user.id)?.id,
  }))
}

export async function getCurrentUser(
  slug: string,
  role: Role,
): Promise<AppUser> {
  const tenant = await getTenantBySlug(slug)
  const user = await getDb().query.users.findFirst({
    where: and(eq(users.schoolId, tenant.id), eq(users.role, role)),
    orderBy: [asc(users.name)],
  })

  if (!user) throw new MissingTenantRoleError(slug, role)

  const child =
    role === 'ortu'
      ? await getDb().query.students.findFirst({
          where: eq(students.parentId, user.id),
        })
      : undefined

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantSlug: slug,
    studentId: child?.id,
  }
}
