import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { getRequest } from '@tanstack/react-start/server'
import { and, eq } from 'drizzle-orm'
import { getDb } from '#/db'
import { schools, users } from '#/db/schema'
import { roleLabels } from '#/lib/domain'
import { hashPassword, verifyPassword } from './password'
import type { Role } from '#/db/schema'
import * as schema from '#/db/schema'

const SESSION_MAX_AGE = 60 * 60 * 8

function getSecret() {
  const secret = process.env.BETTER_AUTH_SECRET
  if (!secret) {
    throw new Error('BETTER_AUTH_SECRET environment variable is required')
  }
  return secret
}

export const auth = betterAuth({
  appName: 'Habits+',
  baseURL: process.env.BETTER_AUTH_URL,
  secret: getSecret(),
  database: drizzleAdapter(getDb(), {
    provider: 'pg',
    schema,
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
    minPasswordLength: 1,
    password: {
      hash: hashPassword,
      verify: ({ hash, password }) => verifyPassword(password, hash),
    },
  },
  session: {
    expiresIn: SESSION_MAX_AGE,
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  user: {
    additionalFields: {
      schoolId: {
        type: 'string',
        required: true,
        input: false,
        fieldName: 'school_id',
      },
      tenantSlug: {
        type: 'string',
        required: true,
        input: false,
        fieldName: 'tenant_slug',
      },
      role: {
        type: 'string',
        required: true,
        input: false,
      },
    },
  },
  plugins: [tanstackStartCookies()],
})

export async function getSession() {
  return await auth.api.getSession({
    headers: getRequest().headers,
  })
}

export async function getAuthenticatedUserByRole(role: Role) {
  const session = await getSession()
  if (!session) {
    throw new Error(
      `Silakan masuk sebagai ${roleLabels[role]} terlebih dahulu.`,
    )
  }
  // Single round trip: the Neon HTTP driver issues one request per query, so
  // fetching the user and school separately doubles the auth latency.
  const rows = await getDb()
    .select({ user: users, school: schools })
    .from(users)
    .innerJoin(schools, eq(schools.id, users.schoolId))
    .where(and(eq(users.id, session.user.id), eq(users.role, role)))
    .limit(1)
  const row = rows.at(0)
  if (!row) {
    throw new Error(
      `Silakan masuk sebagai ${roleLabels[role]} terlebih dahulu.`,
    )
  }
  return {
    id: row.user.id,
    name: row.user.name,
    email: row.user.email,
    role: row.user.role,
    tenantSlug: row.user.tenantSlug,
    schoolName: row.school.name,
    tenant: row.school,
  }
}
