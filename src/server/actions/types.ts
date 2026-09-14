import type { Frequency, Indicator } from '#/db/schema'

import type { z } from 'zod'
import type {
  addUserSchema,
  updateUserSchema,
  addClassSchema,
  updateClassSchema,
  addStudentSchema,
  updateStudentSchema,
  bulkImportSchema,
  deleteSchema,
} from './schemas'

export type AddUserInput = z.infer<typeof addUserSchema>
export type UpdateUserInput = z.infer<typeof updateUserSchema>
export type AddClassInput = z.infer<typeof addClassSchema>
export type UpdateClassInput = z.infer<typeof updateClassSchema>
export type AddStudentInput = z.infer<typeof addStudentSchema>
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>
export type BulkImportInput = z.infer<typeof bulkImportSchema>
export type BulkImportKind = BulkImportInput['kind']
export type BulkImportMode = NonNullable<BulkImportInput['mode']>
export type DeleteInput = z.infer<typeof deleteSchema>

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
  classId: string
  observedAt?: string
  note?: string
  rows: Array<{
    studentId: string
    values: Record<Indicator, Frequency>
  }>
}

export type SaveWeeklyNoteInput = {
  classId: string
  weekStart?: string
  p1: string
  p2: string
  p3: string
}

export type SaveMonthlySummaryInput = {
  classId: string
  month: string
  text: string
}
