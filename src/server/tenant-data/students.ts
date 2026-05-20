import { asc, eq } from 'drizzle-orm'
import { getDb } from '#/db'
import { students } from '#/db/schema'
import type { Student, Tenant } from './types'

export async function getTenantStudents(
  tenant: Tenant,
): Promise<Array<Student>> {
  return getDb().query.students.findMany({
    where: eq(students.schoolId, tenant.id),
    orderBy: [asc(students.name)],
  })
}
