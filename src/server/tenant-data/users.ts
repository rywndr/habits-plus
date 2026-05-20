import { asc, eq, inArray } from 'drizzle-orm'
import { getDb } from '#/db'
import { students, users } from '#/db/schema'
import type { AppUser, Tenant } from './types'

export async function getTenantUsers(tenant: Tenant): Promise<Array<AppUser>> {
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
    tenantSlug: tenant.slug,
    studentId: linkedStudents.find((s) => s.parentId === user.id)?.id,
  }))
}
