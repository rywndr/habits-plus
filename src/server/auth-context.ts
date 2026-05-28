import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { getDb } from '#/db'
import { accounts, users } from '#/db/schema'
import { verifyPassword } from './password'

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
})

function logLoginFailure(reason: string, detail?: unknown) {
  console.error('[auth] login failed', {
    reason,
    detail: detail instanceof Error ? detail.message : detail,
  })
}

export const loginWithPassword = createServerFn({ method: 'POST' })
  .inputValidator((data) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    const user = await getDb().query.users.findFirst({
      where: eq(users.email, data.email),
    })

    if (!user) {
      logLoginFailure('user_not_found')
      throw new Error('Email atau kata sandi tidak sesuai.')
    }

    const account = await getDb().query.accounts.findFirst({
      where: and(
        eq(accounts.userId, user.id),
        eq(accounts.providerId, 'credential'),
      ),
    })

    if (!account?.password) {
      logLoginFailure('credential_account_not_found', { userId: user.id })
      throw new Error('Email atau kata sandi tidak sesuai.')
    }

    const isPasswordValid = await verifyPassword(data.password, account.password)
    if (!isPasswordValid) {
      logLoginFailure('manual_password_verify_failed', { userId: user.id })
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

    const result = await auth.api
      .signInEmail({
        body: {
          email: data.email,
          password: data.password,
          rememberMe: false,
        },
        headers: request.headers,
        returnHeaders: true,
      })
      .catch((error) => {
        logLoginFailure('better_auth_sign_in_failed', error)
        throw new Error('Email atau kata sandi tidak sesuai.')
      })

    if (result.response.user.id !== user.id) {
      logLoginFailure('better_auth_user_mismatch', {
        appUserId: user.id,
        authUserId: result.response.user.id,
      })
      await auth.api.signOut({ headers: request.headers })
      throw new Error('Email atau kata sandi tidak sesuai.')
    }

    const cookies = parseSetCookieHeader(result.headers.get('set-cookie') ?? '')
    if (!cookies.size) {
      logLoginFailure('missing_set_cookie_header', { userId: user.id })
    }

    cookies.forEach((value, key) => {
      if (key) setCookie(key, value.value, toCookieOptions(value))
    })

    return { role: user.role, schoolId: user.schoolId }
  })
