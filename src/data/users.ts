export type Role = 'super-admin' | 'admin' | 'guru' | 'ortu'

export type User = {
  id: string
  name: string
  email: string
  role: Role
  tenantSlug: string
  /** for parents: id of linked student */
  studentId?: string
}

export const users: Array<User> = [
  {
    id: 'u-super-admin-1',
    name: 'Super Admin',
    email: 'superadmin@habitsplus.id',
    role: 'super-admin',
    tenantSlug: 'platform',
  },
  {
    id: 'u-admin-1',
    name: 'Siti Aminah',
    email: 'admin@habitsplus.id',
    role: 'admin',
    tenantSlug: 'demo',
  },
  {
    id: 'u-guru-1',
    name: "Nurhidayatul Mar'ah",
    email: 'nurhidayatul@gmail.com',
    role: 'guru',
    tenantSlug: 'demo',
  },
  {
    id: 'u-ortu-1',
    name: 'Diana Raharja',
    email: 'dianaraharja@gmail.com',
    role: 'ortu',
    tenantSlug: 'demo',
    studentId: 's-4',
  },
]

export function getCurrentUser(role: Role): User {
  return users.find((u) => u.role === role) ?? users[0]
}
