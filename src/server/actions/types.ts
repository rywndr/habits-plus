import type { Frequency, Gender, Indicator, Role } from '#/db/schema'

export type AddUserInput = {
  tenant?: string
  name: string
  email: string
  password: string
  role: Role
  classIds?: Array<string>
  studentId?: string
}

export type UpdateUserInput = {
  tenant?: string
  id: string
  name: string
  email: string
  password?: string
  role?: Role
  classIds?: Array<string>
  studentId?: string
}

export type AddClassInput = {
  tenant?: string
  name: string
  teacherId?: string
}

export type UpdateClassInput = {
  tenant?: string
  id: string
  name: string
  teacherId?: string
}

export type AddStudentInput = {
  tenant?: string
  nisn: string
  name: string
  classId: string
  gender: Gender
  parentId?: string
}

export type UpdateStudentInput = {
  tenant?: string
  id: string
  nisn: string
  name: string
  classId: string
  gender: Gender
}

export type BulkImportKind = 'teachers' | 'students' | 'parents'

export type BulkImportInput = {
  tenant?: string
  kind: BulkImportKind
  rows: Array<Record<string, string>>
}

export type DeleteInput = {
  tenant?: string
  id: string
}

export type CreateSchoolInput = {
  name: string
  slug: string
  region: string
}

export type CreateSchoolAdminInput = {
  schoolId: string
  name: string
  email: string
  password: string
}

export type UpdateSchoolInput = {
  id: string
  name: string
  region: string
}

export type UpdateSchoolAdminInput = {
  id: string
  schoolId: string
  name: string
  email: string
  password?: string
}

export type SaveDailyObservationsInput = {
  tenant?: string
  classId: string
  observedAt?: string
  note?: string
  rows: Array<{
    studentId: string
    values: Record<Indicator, Frequency>
  }>
}

export type SaveWeeklyNoteInput = {
  tenant?: string
  classId: string
  weekStart?: string
  p1: string
  p2: string
  p3: string
}

export type SaveMonthlySummaryInput = {
  tenant?: string
  classId: string
  month: string
  text: string
}
