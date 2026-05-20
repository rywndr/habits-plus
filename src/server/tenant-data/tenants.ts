import { AsyncLocalStorage } from 'node:async_hooks'
import { eq } from 'drizzle-orm'
import { getDb } from '#/db'
import { schools } from '#/db/schema'
import { TenantNotFoundError } from '#/lib/app-errors'
import type { Tenant } from './types'

const tenantCache = new AsyncLocalStorage<Map<string, Promise<Tenant>>>()

export function withTenantCache<T>(fn: () => Promise<T>): Promise<T> {
  return tenantCache.run(new Map(), fn)
}

export async function getTenantBySlug(slug: string): Promise<Tenant> {
  const store = tenantCache.getStore()
  const cached = store?.get(slug)
  if (cached) return cached

  const promise = (async () => {
    const tenant = await getDb().query.schools.findFirst({
      where: eq(schools.slug, slug),
    })
    if (!tenant) throw new TenantNotFoundError(slug)
    return tenant
  })()

  store?.set(slug, promise)
  return promise
}
