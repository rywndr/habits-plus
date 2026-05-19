import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '#/db'
import { schools, users } from '#/db/schema'

const loginContextSchema = z.object({
  tenant: z.string().min(1),
  role: z.enum(['admin', 'guru', 'ortu']),
})

const loginSchema = loginContextSchema.extend({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
})

export const loginWithPassword = createServerFn({ method: 'POST' })
  .inputValidator((data) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    const tenant = await getDb().query.schools.findFirst({
      where: eq(schools.slug, data.tenant),
    })

    if (!tenant) {
      throw new Error('Sekolah tidak ditemukan. Periksa kembali alamat login.')
    }

    const user = await getDb().query.users.findFirst({
      where: and(
        eq(users.schoolId, tenant.id),
        eq(users.email, data.email),
        eq(users.role, data.role),
      ),
    })

    if (!user) {
      throw new Error('Email, kata sandi, atau peran tidak sesuai.')
    }

    const [
      { getRequest, setCookie },
      { parseSetCookieHeader, toCookieOptions },
      { auth },
    ] = await Promise.all([
      import('@tanstack/react-start/server'),
      import('better-auth/cookies'),
      import('./auth.server'),
    ])
    const request = getRequest()

    const result = await auth.api.signInEmail({
      body: {
        email: data.email,
        password: data.password,
        rememberMe: false,
      },
      headers: request.headers,
      returnHeaders: true,
    })

    if (result.response.user.id !== user.id) {
      await auth.api.signOut({ headers: request.headers })
      throw new Error('Email, kata sandi, atau peran tidak sesuai.')
    }

    const cookies = parseSetCookieHeader(result.headers.get('set-cookie') ?? '')
    cookies.forEach((value, key) => {
      if (key) setCookie(key, value.value, toCookieOptions(value))
    })

    return { role: user.role }
  })

export const validateLoginContext = createServerFn({ method: 'GET' })
  .inputValidator((data) => loginContextSchema.parse(data))
  .handler(async ({ data }) => {
    const { getAuthenticatedUser } = await import('./auth.server')
    const user = await getAuthenticatedUser(data.tenant, data.role)

    return { role: user.role }
  })
