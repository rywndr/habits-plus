import { beforeEach, expect, it, vi } from 'vitest'
import { PgDialect } from 'drizzle-orm/pg-core'
import type { SQL } from 'drizzle-orm'
import { upsertUserByEmail } from './shared'
import { hashPassword } from '../password'
import { accounts, users } from '#/db/schema'

const database = vi.hoisted(() => {
  const returning = vi.fn<() => Promise<Array<{ id: string }>>>()
  const onConflictDoUpdate = vi.fn<
    (options: { setWhere?: SQL }) => { returning: typeof returning }
  >(() => ({ returning }))
  const values = vi.fn(() => ({ onConflictDoUpdate }))
  const insert = vi.fn(() => ({ values }))
  return { insert, values, onConflictDoUpdate, returning }
})

vi.mock('#/db', () => ({ getDb: () => database }))
vi.mock('../password', () => ({ hashPassword: vi.fn(async () => 'hash') }))

beforeEach(() => vi.clearAllMocks())

it.each(['guru', 'ortu', 'admin'] as const)(
  'only overwrites a matching %s account and never resets credentials after a rejected conflict',
  async (role) => {
    database.returning.mockResolvedValue([])
    await expect(
      upsertUserByEmail({
        tenantId: 'school-a',
        tenantSlug: 'school-a',
        name: 'Name',
        email: 'email@example.test',
        password: 'password',
        role,
      }),
    ).rejects.toThrow('peran berbeda')
    const options = database.onConflictDoUpdate.mock.calls.at(0)?.[0]
    if (!options?.setWhere) throw new Error('Missing role predicate')
    const query = new PgDialect().sqlToQuery(options.setWhere)
    expect(query.sql).toBe('"users"."role" = $1')
    expect(query.params).toEqual([role])
    expect(database.insert).toHaveBeenCalledExactlyOnceWith(users)
    expect(hashPassword).not.toHaveBeenCalled()
  },
)

it('writes credentials for the user returned by a permitted upsert', async () => {
  database.returning.mockResolvedValue([{ id: 'permitted-user' }])
  await expect(
    upsertUserByEmail({
      tenantId: 'school-a',
      tenantSlug: 'school-a',
      name: 'Name',
      email: 'email@example.test',
      password: 'password',
      role: 'guru',
    }),
  ).resolves.toBe('permitted-user')
  expect(database.insert).toHaveBeenNthCalledWith(2, accounts)
  expect(database.values).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({ userId: 'permitted-user', password: 'hash' }),
  )
})
