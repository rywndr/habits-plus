import { readFileSync, readdirSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  requireAdmin,
  requireTeacher,
  requireSuperAdmin,
} from './authorization'
import { getAuthenticatedUserByRole } from './auth.server'
import {
  addUserSchema,
  updateUserSchema,
  addClassSchema,
  updateClassSchema,
  addStudentSchema,
  updateStudentSchema,
  bulkImportSchema,
  deleteSchema,
} from './actions/schemas'

vi.mock('./auth.server', () => ({ getAuthenticatedUserByRole: vi.fn() }))

beforeEach(() => vi.resetAllMocks())

describe.each([
  { middleware: requireAdmin, role: 'admin', key: 'admin' },
  { middleware: requireTeacher, role: 'guru', key: 'teacher' },
  { middleware: requireSuperAdmin, role: 'super-admin', key: 'superAdmin' },
] as const)('$role authorization', ({ middleware, role, key }) => {
  const server = middleware.options.server
  if (!server) throw new Error('Missing server middleware')
  const forgedUser = {
    id: 'forged',
    name: 'Forged',
    email: 'forged@example.test',
    role,
    tenantSlug: 'other-school',
    schoolName: 'Other',
    tenant: {
      id: 'other-school',
      slug: 'other-school',
      name: 'Other',
      region: 'Other',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  }
  const context = {
    admin: forgedUser,
    teacher: forgedUser,
    superAdmin: forgedUser,
  }

  it('stops unauthenticated or wrong-role requests before the handler', async () => {
    vi.mocked(getAuthenticatedUserByRole).mockRejectedValue(
      new Error('Unauthorized'),
    )
    const next = vi.fn(async () => {
      throw new Error('Handler reached')
    })
    await expect(
      server({
        next,
        context,
        data: undefined,
        method: 'POST',
        serverFnMeta: { id: 'test', name: 'test', filename: 'test' },
        signal: new AbortController().signal,
      }),
    ).rejects.toThrow('Unauthorized')
    expect(getAuthenticatedUserByRole).toHaveBeenCalledWith(role)
    expect(next).not.toHaveBeenCalled()
  })

  it('supplies only the authenticated user and tenant to the next handler', async () => {
    const user = {
      id: 'user-a',
      name: 'User',
      email: 'user@example.test',
      role,
      tenantSlug: 'school-a',
      schoolName: 'School A',
      tenant: {
        id: 'school-a',
        slug: 'school-a',
        name: 'School A',
        region: 'Region',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }
    vi.mocked(getAuthenticatedUserByRole).mockResolvedValue(user)
    const next = vi.fn(async () => {
      throw new Error('Handler reached')
    })
    await expect(
      server({
        next,
        context,
        data: undefined,
        method: 'POST',
        serverFnMeta: { id: 'test', name: 'test', filename: 'test' },
        signal: new AbortController().signal,
      }),
    ).rejects.toThrow('Handler reached')
    expect(getAuthenticatedUserByRole).toHaveBeenCalledWith(role)
    expect(next).toHaveBeenCalledWith({ context: { [key]: user } })
  })
})

const userInput = {
  name: 'Teacher',
  email: 'teacher@example.test',
  password: 'secret123',
  role: 'guru',
}
describe('admin RPC input validation', () => {
  it.each(['admin', 'super-admin', 'unknown', null])(
    'rejects creating or assigning role %s',
    (role) => {
      expect(addUserSchema.safeParse({ ...userInput, role }).success).toBe(
        false,
      )
      expect(
        updateUserSchema.safeParse({
          ...userInput,
          id: '11111111-1111-4111-8111-111111111111',
          role,
        }).success,
      ).toBe(false)
    },
  )

  it.each([
    { schema: addUserSchema, data: userInput },
    {
      schema: updateUserSchema,
      data: { ...userInput, id: '11111111-1111-4111-8111-111111111111' },
    },
    { schema: addClassSchema, data: { name: 'Class' } },
    {
      schema: updateClassSchema,
      data: { id: '11111111-1111-4111-8111-111111111111', name: 'Class' },
    },
    {
      schema: addStudentSchema,
      data: {
        nisn: '123',
        name: 'Student',
        classId: '11111111-1111-4111-8111-111111111111',
        gender: 'L',
      },
    },
    {
      schema: updateStudentSchema,
      data: {
        id: '11111111-1111-4111-8111-111111111111',
        nisn: '123',
        name: 'Student',
        classId: '11111111-1111-4111-8111-111111111111',
        gender: 'L',
      },
    },
    { schema: bulkImportSchema, data: { kind: 'teachers', rows: [] } },
    {
      schema: deleteSchema,
      data: { id: '11111111-1111-4111-8111-111111111111' },
    },
  ])(
    'accepts valid data and rejects a browser tenant override: $data',
    ({ schema, data }) => {
      expect(schema.safeParse(data).success).toBe(true)
      expect(
        schema.safeParse({ ...data, tenant: 'other-school' }).success,
      ).toBe(false)
    },
  )

  it('rejects invalid import kinds and modes', () => {
    expect(
      bulkImportSchema.safeParse({ kind: 'admins', rows: [] }).success,
    ).toBe(false)
    expect(
      bulkImportSchema.safeParse({
        kind: 'teachers',
        mode: 'unknown',
        rows: [],
      }).success,
    ).toBe(false)
  })
})

// Make adding an unguarded mutation in any role-specific action module fail CI.
describe('mutation authorization coverage', () => {
  const directory = new URL('./actions/', import.meta.url)
  for (const file of readdirSync(directory).filter((name) =>
    /^(admin-|guru-|super-admin-).*\.ts$/.test(name),
  )) {
    it(`${file} attaches the required middleware to every server function`, () => {
      const source = readFileSync(new URL(file, directory), 'utf8')
      const middleware = file.startsWith('admin-')
        ? 'requireAdmin'
        : file.startsWith('guru-')
          ? 'requireTeacher'
          : 'requireSuperAdmin'
      const functions = source.split('createServerFn({').slice(1)
      expect(functions.length).toBeGreaterThan(0)
      for (const fn of functions) {
        expect(fn.slice(0, fn.indexOf('.handler('))).toContain(
          `.middleware([${middleware}])`,
        )
      }
      expect(source).not.toContain('resolveTenant')
    })
  }
})
