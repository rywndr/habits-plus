import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '#/db'
import { users } from '#/db/schema'

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
})

export const loginWithPassword = createServerFn({ method: 'POST' })
  .inputValidator((data) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await getDb().query.users.findFirst({
      where: eq(users.email, data.email),
    })

    if (!user) {
      throw new Error('Email atau kata sandi tidak sesuai.')
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
      throw new Error('Email atau kata sandi tidak sesuai.')
    }

    const cookies = parseSetCookieHeader(result.headers.get('set-cookie') ?? '')
    cookies.forEach((value, key) => {
      if (key) setCookie(key, value.value, toCookieOptions(value))
    })

    return { role: user.role, schoolId: user.schoolId }
  })
