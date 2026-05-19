import { asc, count, eq } from 'drizzle-orm'
import { getDb } from '#/db'
import { classes, schools, students } from '#/db/schema'
import { getTenantBySlug } from './tenants'
import type { ClassRoom } from './types'

export async function getTenantClasses(
  slug: string,
): Promise<Array<ClassRoom>> {
  const tenant = await getTenantBySlug(slug)
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
    .where(eq(classes.schoolId, tenant.id))
    .groupBy(classes.id, schools.slug)
    .orderBy(asc(classes.name))

  return rows
}
