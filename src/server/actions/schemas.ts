import { z } from 'zod'
import { frequencyEnum, indicatorEnum } from '#/db/schema/enums'

export const managedUserRoleSchema = z.enum(['guru', 'ortu'])
const text = z.string().trim().min(1).max(255)
const id = z.uuid()
const optionalId = z.union([id, z.literal('')]).optional()
export const emailSchema = z.string().trim().max(254).pipe(z.email())
export const passwordSchema = z
  .string()
  .min(8)
  .max(128)
  .refine((value) => value.trim().length > 0)
export const optionalPasswordSchema = z
  .union([passwordSchema, z.literal('')])
  .optional()
const userFields = {
  name: text,
  email: emailSchema,
  classIds: z.array(id).max(100).optional(),
  studentId: optionalId,
}
export const addUserSchema = z.strictObject({
  ...userFields,
  password: passwordSchema,
  role: managedUserRoleSchema,
})
export const updateUserSchema = z.strictObject({
  ...userFields,
  id,
  password: optionalPasswordSchema,
  role: managedUserRoleSchema.optional(),
})
export const addClassSchema = z.strictObject({
  name: text,
  teacherId: optionalId,
})
export const updateClassSchema = addClassSchema.extend({ id })
export const addStudentSchema = z.strictObject({
  nisn: text,
  name: text,
  classId: id,
  gender: z.enum(['L', 'P']),
  parentId: optionalId,
})
export const updateStudentSchema = addStudentSchema
  .omit({ parentId: true })
  .extend({ id })
export const bulkImportSchema = z.strictObject({
  kind: z.enum(['teachers', 'students', 'parents']),
  mode: z.enum(['create', 'update']).optional(),
  rows: z
    .array(
      z
        .record(z.string().max(100), z.string().max(1000))
        .refine((row) => Object.keys(row).length <= 30),
    )
    .max(1000),
})
export const deleteSchema = z.strictObject({ id })

const date = z.iso.date()
const content = z.string().trim().min(1).max(10000)
export const createSchoolSchema = z.strictObject({
  name: text,
  slug: text,
  region: text,
})
export const updateSchoolSchema = createSchoolSchema
  .omit({ slug: true })
  .extend({ id })
export const createSchoolAdminSchema = z.strictObject({
  schoolId: id,
  name: text,
  email: emailSchema,
  password: passwordSchema,
})
export const updateSchoolAdminSchema = createSchoolAdminSchema.extend({
  id,
  password: optionalPasswordSchema,
})
export const saveDailyObservationsSchema = z.strictObject({
  classId: id,
  observedAt: date.optional(),
  note: z.string().max(10000).optional(),
  rows: z
    .array(
      z.strictObject({
        studentId: id,
        values: z.record(
          z.enum(indicatorEnum.enumValues),
          z.enum(frequencyEnum.enumValues).nullable(),
        ),
      }),
    )
    .max(200),
})
export const saveWeeklyNoteSchema = z.strictObject({
  classId: id,
  weekStart: date.optional(),
  p1: content,
  p2: content,
  p3: content,
})
export const saveMonthlySummarySchema = z.strictObject({
  classId: id,
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
  text: content,
})
export const generateAiSummariesSchema = z.strictObject({
  weekStart: date,
  classId: id,
  studentIds: z.array(id).max(200),
})
export const acceptAiSummariesSchema = z.strictObject({
  weekStart: date,
  classId: id,
  items: z.array(z.strictObject({ studentId: id, content })).max(200),
})
