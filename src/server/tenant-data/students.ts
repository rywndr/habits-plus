import { and, asc, eq, inArray } from 'drizzle-orm'
import { getDb } from '#/db'
import { students } from '#/db/schema'
import type { Student, Tenant } from './types'

export async function getTenantStudents(
  tenant: Tenant,
  classIds?: Array<string>,
): Promise<Array<Student>> {
  if (classIds && classIds.length === 0) return []

  return getDb().query.students.findMany({
    where: classIds
      ? and(
          eq(students.schoolId, tenant.id),
          inArray(students.classId, classIds),
        )
      : eq(students.schoolId, tenant.id),
    orderBy: [asc(students.name)],
  })
}
