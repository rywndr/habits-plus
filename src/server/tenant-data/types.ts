import type { Frequency, Indicator, Role } from '#/db/schema'
import type { Trend } from '#/data'

export type { Frequency, Indicator, Role }

export type Tenant = {
  id: string
  slug: string
  name: string
  region: string
}

export type AppUser = {
  id: string
  name: string
  email: string
  role: Role
  tenantSlug: string
  studentId?: string
  classIds?: Array<string>
  classNames?: Array<string>
}

export type ClassRoom = {
  id: string
  name: string
  teacherId: string | null
  tenantSlug: string
  studentCount: number
}

export type Student = {
  id: string
  nisn: string
  name: string
  classId: string
  gender: 'L' | 'P'
  parentId: string | null
}

export type ObservationRow = {
  studentId: string
  values: Record<Indicator, Frequency>
}

export type ObservationDay = {
  rows: Array<ObservationRow>
  note: string
}

export type WeeklyNote = {
  id: string
  date: string
  dateLabel: string
  p1: string
  p2: string
  p3: string
}

export type MonthlySummary = {
  month: string
  monthLabel: string
  text: string
  trends: Partial<Record<Indicator, Trend>>
  averages: Partial<Record<Indicator, Frequency>>
  radar: Array<{
    week: string
    values: Record<Indicator, number>
  }>
}
