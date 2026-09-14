import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest'
import { generateDrizzleJson, generateMigration } from 'drizzle-kit/api'
import * as schema from '#/db/schema'
import { importAdminRows } from './import-admin-rows'
import { getAdminDashboard } from '../tenant-data/dashboards'
import { verifyPassword } from '../password'

const harness = await vi.hoisted(async () => {
  const { PGlite } = await import('@electric-sql/pglite')
  const { drizzle } = await import('drizzle-orm/pglite')
  const pg = new PGlite()
  const db = drizzle(pg)
  const batch = vi.fn(
    async (
      queries: Array<{ toSQL: () => { sql: string; params: Array<unknown> } }>,
    ) =>
      pg.transaction(async (tx) => {
        for (const query of queries) {
          const { sql, params } = query.toSQL()
          await tx.query(sql, params)
        }
      }),
  )
  return { pg, db, batch, select: vi.fn(db.select.bind(db)) }
})
vi.mock('#/db', () => ({
  getDb: () => ({
    select: harness.select,
    insert: harness.db.insert.bind(harness.db),
    update: harness.db.update.bind(harness.db),
    batch: harness.batch,
  }),
}))

const tenant = {
  id: '11111111-1111-4111-8111-111111111111',
  slug: 'school-a',
  name: 'School A',
  region: 'Region',
}
const other = {
  ...tenant,
  id: '22222222-2222-4222-8222-222222222222',
  slug: 'school-b',
}
const classId = '33333333-3333-4333-8333-333333333333'
const otherClassId = '44444444-4444-4444-8444-444444444444'
const teacher = {
  name: 'Teacher',
  email: 'teacher@example.com',
  password: 'password123',
  kelas: 'A',
}
const student = { name: 'Student', nisn: '123', gender: 'L', kelas: 'A' }

beforeAll(async () => {
  const statements = await generateMigration(
    generateDrizzleJson({}),
    generateDrizzleJson(schema),
  )
  await harness.pg.exec(statements.join(';'))
}, 30000)
afterAll(() => harness.pg.close())
beforeEach(async () => {
  await harness.pg.exec('TRUNCATE schools CASCADE')
  await harness.db.insert(schema.schools).values([tenant, other])
  await harness.db.insert(schema.classes).values([
    { id: classId, schoolId: tenant.id, name: 'A' },
    { id: otherClassId, schoolId: other.id, name: 'Other only' },
  ])
  vi.clearAllMocks()
})

it('returns numeric tenant counts with one query, including empty schools', async () => {
  await harness.db.insert(schema.users).values([
    {
      schoolId: tenant.id,
      email: 'teacher@example.com',
      name: 'Teacher',
      role: 'guru',
    },
    {
      schoolId: tenant.id,
      email: 'parent@example.com',
      name: 'Parent',
      role: 'ortu',
    },
    {
      schoolId: tenant.id,
      email: 'admin@example.com',
      name: 'Admin',
      role: 'admin',
    },
    {
      schoolId: other.id,
      email: 'teacher@example.com',
      name: 'Other teacher',
      role: 'guru',
    },
  ])
  await harness.db.insert(schema.students).values({
    schoolId: tenant.id,
    classId,
    nisn: '1',
    name: 'Student',
    gender: 'L',
  })
  expect(await getAdminDashboard(tenant)).toEqual({
    tenant,
    teachersCount: 1,
    parentsCount: 1,
    classesCount: 1,
    studentsCount: 1,
  })
  expect(harness.select).toHaveBeenCalledTimes(1)
  await harness.db.delete(schema.users)
  await harness.db.delete(schema.students)
  await harness.db.delete(schema.classes)
  expect(await getAdminDashboard(tenant)).toEqual({
    tenant,
    teachersCount: 0,
    parentsCount: 0,
    classesCount: 0,
    studentsCount: 0,
  })
})

it('imports 1000 students with one lookup and 20 HTTP batches', async () => {
  const result = await importAdminRows(tenant, {
    kind: 'students',
    rows: Array.from({ length: 1000 }, (_, i) => ({
      ...student,
      nisn: String(i),
    })),
  })
  expect(result).toEqual({ imported: 1000, errors: [] })
  expect(harness.select).toHaveBeenCalledTimes(1)
  expect(harness.batch).toHaveBeenCalledTimes(20)
  expect(
    harness.batch.mock.calls.every(([queries]) => queries.length === 1),
  ).toBe(true)
  expect(await harness.db.select().from(schema.students)).toHaveLength(1000)
}, 30000)

it('validates references and roles before creating users or credentials', async () => {
  await harness.db.insert(schema.users).values({
    schoolId: tenant.id,
    email: 'admin@example.com',
    name: 'Admin',
    role: 'admin',
  })
  const result = await importAdminRows(tenant, {
    kind: 'teachers',
    rows: [
      { ...teacher, kelas: 'Other only' },
      { ...teacher, email: 'admin@example.com' },
      { ...teacher, email: 'invalid' },
      teacher,
    ],
  })
  expect(result.imported).toBe(1)
  expect(result.errors).toHaveLength(3)
  const users = await harness.db.select().from(schema.users)
  expect(users).toHaveLength(2)
  expect(users.find((user) => user.email === teacher.email)?.role).toBe('guru')
  expect(await harness.db.select().from(schema.accounts)).toHaveLength(1)
  const parents = await importAdminRows(tenant, {
    kind: 'parents',
    rows: [{ ...teacher, email: 'parent@example.com', nisn: 'missing' }],
  })
  expect(parents.imported).toBe(0)
  expect(await harness.db.select().from(schema.users)).toHaveLength(2)
})

it('preserves duplicate row order, credentials on blank updates, and class replacement', async () => {
  const result = await importAdminRows(tenant, {
    kind: 'teachers',
    mode: 'update',
    rows: [
      teacher,
      {
        ...teacher,
        name: 'Renamed',
        email: 'TEACHER@example.com',
        password: '',
        kelas: '',
      },
    ],
  })
  expect(result).toEqual({ imported: 2, errors: [] })
  const users = await harness.db.select().from(schema.users)
  expect(users).toHaveLength(1)
  expect(users[0]?.name).toBe('Renamed')
  const account = (await harness.db.select().from(schema.accounts)).at(0)
  expect(
    account?.password &&
      (await verifyPassword(teacher.password, account.password)),
  ).toBe(true)
  expect(
    (await harness.db.select().from(schema.classes)).every(
      (row) => row.teacherId === null,
    ),
  ).toBe(true)
  await importAdminRows(tenant, {
    kind: 'students',
    rows: [student, { ...student, name: 'Last row', gender: 'P' }],
  })
  const rows = await harness.db.select().from(schema.students)
  expect(rows).toHaveLength(1)
  expect(rows[0]).toMatchObject({ name: 'Last row', gender: 'P' })
})

it('reassigns parents in input order without touching another school', async () => {
  await importAdminRows(tenant, { kind: 'students', rows: [student] })
  await harness.db.insert(schema.students).values({
    schoolId: other.id,
    classId: otherClassId,
    name: 'Other child',
    nisn: '123',
    gender: 'P',
  })
  const result = await importAdminRows(tenant, {
    kind: 'parents',
    rows: [
      { ...teacher, email: 'first@example.com', nisn: '123' },
      { ...teacher, email: 'second@example.com', nisn: '123' },
    ],
  })
  expect(result).toEqual({ imported: 2, errors: [] })
  const users = await harness.db.select().from(schema.users)
  const rows = await harness.db.select().from(schema.students)
  expect(rows.find((row) => row.schoolId === tenant.id)?.parentId).toBe(
    users.find((user) => user.email === 'second@example.com')?.id,
  )
  expect(rows.find((row) => row.schoolId === other.id)?.parentId).toBeNull()
})

it('rolls back users and credentials when a later write fails, and reports every affected row', async () => {
  await harness.pg
    .exec(`CREATE FUNCTION reject_assignment() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'test failure'; END $$;
    CREATE TRIGGER reject_assignment BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION reject_assignment();`)
  try {
    const result = await importAdminRows(tenant, {
      kind: 'teachers',
      rows: [teacher, { ...teacher, email: 'second@example.com' }],
    })
    expect(result.imported).toBe(0)
    expect(result.errors).toHaveLength(2)
    expect(await harness.db.select().from(schema.users)).toHaveLength(0)
    expect(await harness.db.select().from(schema.accounts)).toHaveLength(0)
  } finally {
    await harness.pg.exec(
      'DROP TRIGGER reject_assignment ON classes; DROP FUNCTION reject_assignment()',
    )
  }
})

it('rejects a concurrent account insert without changing its role or credentials', async () => {
  const executeBatch = harness.batch.getMockImplementation()
  if (!executeBatch) throw new Error('Missing batch executor')
  harness.batch.mockImplementationOnce(async (queries) => {
    await harness.db.insert(schema.users).values({
      schoolId: tenant.id,
      name: 'Concurrent admin',
      email: teacher.email,
      role: 'admin',
    })
    return executeBatch(queries)
  })
  const result = await importAdminRows(tenant, {
    kind: 'teachers',
    rows: [teacher],
  })
  expect(result.imported).toBe(0)
  expect(result.errors).toHaveLength(1)
  expect(await harness.db.select().from(schema.users)).toMatchObject([
    { name: 'Concurrent admin', role: 'admin' },
  ])
  expect(await harness.db.select().from(schema.accounts)).toHaveLength(0)
})

it('does no database work for an empty import', async () => {
  expect(await importAdminRows(tenant, { kind: 'students', rows: [] })).toEqual(
    { imported: 0, errors: [] },
  )
  expect(harness.select).not.toHaveBeenCalled()
  expect(harness.batch).not.toHaveBeenCalled()
})
