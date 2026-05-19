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
  return (
    process.env.BETTER_AUTH_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.DATABASE_URL ??
    'habits-plus-dev'
  )
}

export const auth = betterAuth({
  appName: 'Habits+',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
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

export async function getAuthenticatedUser(tenant: string, role: Role) {
  const session = await getSession()

  if (!session) {
    throw new Error(
      `Silakan masuk sebagai ${roleLabels[role]} terlebih dahulu.`,
    )
  }

  const user = await getDb().query.users.findFirst({
    where: and(
      eq(users.id, session.user.id),
      eq(users.tenantSlug, tenant),
      eq(users.role, role),
    ),
  })

  if (!user) {
    throw new Error(
      `Silakan masuk sebagai ${roleLabels[role]} terlebih dahulu.`,
    )
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantSlug: user.tenantSlug,
  }
}

export async function getAuthenticatedUserByRole(role: Role) {
  const session = await getSession()

  if (!session) {
    throw new Error(
      `Silakan masuk sebagai ${roleLabels[role]} terlebih dahulu.`,
    )
  }

  const user = await getDb().query.users.findFirst({
    where: and(eq(users.id, session.user.id), eq(users.role, role)),
  })

  if (!user) {
    throw new Error(
      `Silakan masuk sebagai ${roleLabels[role]} terlebih dahulu.`,
    )
  }

  const school = await getDb().query.schools.findFirst({
    where: eq(schools.id, user.schoolId),
  })

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantSlug: user.tenantSlug,
    schoolName: school?.name ?? user.tenantSlug,
  }
}
