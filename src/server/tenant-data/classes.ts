import { and, asc, count, eq } from 'drizzle-orm'
import { getDb } from '#/db'
import { classes, schools, students } from '#/db/schema'
import type { ClassRoom, Tenant } from './types'

export async function getTenantClasses(
  tenant: Tenant,
  teacherId?: string,
): Promise<Array<ClassRoom>> {
  const rows = await getDb()
    .select({
      id: classes.id,
      name: classes.name,
      teacherId: classes.teacherId,
      tenantSlug: schools.slug,
      studentCount: count(students.id),
    })
    .from(classes)
    .innerJoin(schools, eq(classes.schoolId, schools.id))
    .leftJoin(students, eq(students.classId, classes.id))
    .where(
      teacherId
        ? and(eq(classes.schoolId, tenant.id), eq(classes.teacherId, teacherId))
        : eq(classes.schoolId, tenant.id),
    )
    .groupBy(classes.id, schools.slug)
    .orderBy(asc(classes.name))

  return rows
}
