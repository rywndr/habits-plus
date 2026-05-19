import { asc, eq } from 'drizzle-orm'
import { getDb } from '#/db'
import { students } from '#/db/schema'
import { getTenantBySlug } from './tenants'
import type { Student } from './types'

export async function getTenantStudents(slug: string): Promise<Array<Student>> {
  const tenant = await getTenantBySlug(slug)
  return getDb().query.students.findMany({
    where: eq(students.schoolId, tenant.id),
    orderBy: [asc(students.name)],
  })
}
