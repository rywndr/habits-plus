import { afterAll, beforeAll, expect, it, vi } from 'vitest'
import { generateDrizzleJson, generateMigration } from 'drizzle-kit/api'
import * as schema from '#/db/schema'
import { assertTenantOwnedUser } from './shared'
import type { z } from 'zod'
import type { updateUserSchema } from './schemas'

type UpdateHandler = (input: {
  data: z.infer<typeof updateUserSchema>
  context: { admin: { tenant: { id: string; slug: string } } }
}) => Promise<unknown>
const handlers = vi.hoisted(() => new Array<UpdateHandler>())
vi.mock('@tanstack/react-start', () => ({
  createMiddleware: () => ({ server: () => ({}) }),
  createServerFn: () => {
    const builder = {
      middleware: () => builder,
      validator: () => builder,
      handler: (handler: UpdateHandler) => {
        handlers.push(handler)
        return handler
      },
    }
    return builder
  },
}))
vi.mock('../tenant-data', () => ({
  withTenantCache: (fn: () => Promise<unknown>) => fn(),
}))
await import('./admin-users')

const harness = await vi.hoisted(async () => {
  const { PGlite } = await import('@electric-sql/pglite')
  const { drizzle } = await import('drizzle-orm/pglite')
  const tables = await import('#/db/schema')
  const pg = new PGlite()
  return { pg, db: drizzle(pg, { schema: tables }) }
})
vi.mock('#/db', () => ({ getDb: () => harness.db }))

const schoolId = '11111111-1111-4111-8111-111111111111'
const otherSchoolId = '22222222-2222-4222-8222-222222222222'
beforeAll(async () => {
  const statements = await generateMigration(
    generateDrizzleJson({}),
    generateDrizzleJson(schema),
  )
  await harness.pg.exec(statements.join(';'))
  await harness.db.insert(schema.schools).values([
    { id: schoolId, slug: 'school', name: 'School', region: 'Region' },
    { id: otherSchoolId, slug: 'other', name: 'Other', region: 'Region' },
  ])
}, 30000)
afterAll(() => harness.pg.close())

it.each(schema.roleEnum.enumValues)(
  'checks actual %s role and school before assignments',
  async (role) => {
    const [user] = await harness.db
      .insert(schema.users)
      .values({
        schoolId,
        name: role,
        email: `${role}@example.test`,
        role,
      })
      .returning()
    for (const requiredRole of ['guru', 'ortu'] as const) {
      if (role === requiredRole) {
        await expect(
          assertTenantOwnedUser(schoolId, user.id, requiredRole),
        ).resolves.toBeUndefined()
      } else {
        await expect(
          assertTenantOwnedUser(schoolId, user.id, requiredRole),
        ).rejects.toThrow('peran')
      }
      await expect(
        assertTenantOwnedUser(otherSchoolId, user.id, requiredRole),
      ).rejects.toThrow('peran')
    }
  },
)

it.each(['guru', 'ortu'] as const)(
  'clears obsolete assignments when a %s changes role',
  async (role) => {
    const [user] = await harness.db
      .insert(schema.users)
      .values({
        schoolId,
        name: 'Changing role',
        email: `change-${role}@example.test`,
        role,
      })
      .returning()
    const [klass] = await harness.db
      .insert(schema.classes)
      .values({
        schoolId,
        name: `Class-${role}`,
        teacherId: role === 'guru' ? user.id : null,
      })
      .returning()
    const [student] = await harness.db
      .insert(schema.students)
      .values({
        schoolId,
        classId: klass.id,
        name: 'Student',
        nisn: role,
        gender: 'L',
        parentId: role === 'ortu' ? user.id : null,
      })
      .returning()
    const update = handlers.at(1)
    if (!update) throw new Error('Missing update handler')
    await update({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: role === 'guru' ? 'ortu' : 'guru',
      },
      context: { admin: { tenant: { id: schoolId, slug: 'school' } } },
    })
    expect(
      await harness.db.query.classes.findFirst({
        where: (table, { eq }) => eq(table.id, klass.id),
      }),
    ).toMatchObject({ teacherId: null })
    expect(
      await harness.db.query.students.findFirst({
        where: (table, { eq }) => eq(table.id, student.id),
      }),
    ).toMatchObject({ parentId: null })
  },
)
