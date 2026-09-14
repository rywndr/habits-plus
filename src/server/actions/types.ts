import type { z } from 'zod'
import type {
  createSchoolSchema,
  updateSchoolSchema,
  createSchoolAdminSchema,
  updateSchoolAdminSchema,
  saveDailyObservationsSchema,
  saveWeeklyNoteSchema,
  saveMonthlySummarySchema,
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

export type CreateSchoolInput = z.infer<typeof createSchoolSchema>
export type UpdateSchoolInput = z.infer<typeof updateSchoolSchema>
export type CreateSchoolAdminInput = z.infer<typeof createSchoolAdminSchema>
export type UpdateSchoolAdminInput = z.infer<typeof updateSchoolAdminSchema>
export type SaveDailyObservationsInput = z.infer<
  typeof saveDailyObservationsSchema
>
export type SaveWeeklyNoteInput = z.infer<typeof saveWeeklyNoteSchema>
export type SaveMonthlySummaryInput = z.infer<typeof saveMonthlySummarySchema>
