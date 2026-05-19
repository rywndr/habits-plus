import { eq } from 'drizzle-orm'
import { getDb } from '#/db'
import { schools } from '#/db/schema'
import { TenantNotFoundError } from '#/lib/app-errors'
import type { Tenant } from './types'

export async function getTenantBySlug(slug: string): Promise<Tenant> {
  const tenant = await getDb().query.schools.findFirst({
    where: eq(schools.slug, slug),
  })

  if (!tenant) {
    throw new TenantNotFoundError(slug)
  }

  return tenant
}
