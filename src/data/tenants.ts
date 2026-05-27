export type Tenant = {
  slug: string
  name: string
  region: string
}

export const tenants: Array<Tenant> = [
  { slug: 'platform', name: 'Habits+ Platform', region: 'Internal' },
  { slug: 'demo', name: 'SLB Demo Habits+', region: 'Kepri' },
  { slug: 'slb-batam-1', name: 'SLB Negeri Batam 1', region: 'Kota Batam' },
  { slug: 'slb-batam-2', name: 'SLB Negeri Batam 2', region: 'Kota Batam' },
  { slug: 'slb-tpi-1', name: 'SLB Negeri Tanjungpinang 1', region: 'Kota Tanjungpinang' },
]

export function getTenantBySlug(slug: string): Tenant {
  return tenants.find((t) => t.slug === slug) ?? tenants[0]
}
