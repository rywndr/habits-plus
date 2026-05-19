export type ClassRoom = {
  id: string
  name: string
  teacherId: string
  tenantSlug: string
  studentCount: number
}

export const classes: Array<ClassRoom> = [
  { id: 'c-1', name: 'VII A', teacherId: 'u-guru-1', tenantSlug: 'demo', studentCount: 10 },
  { id: 'c-2', name: 'VII B', teacherId: 'u-guru-1', tenantSlug: 'demo', studentCount: 12 },
  { id: 'c-3', name: 'VIII A', teacherId: 'u-guru-1', tenantSlug: 'demo', studentCount: 9 },
]
