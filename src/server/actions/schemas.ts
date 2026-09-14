import { z } from 'zod'

export const managedUserRoleSchema = z.enum(['guru', 'ortu'])
const text = z.string().trim().min(1)
const userFields = {
  name: text,
  email: text,
  classIds: z.array(text).optional(),
  studentId: z.string().optional(),
}
export const addUserSchema = z.strictObject({
  ...userFields,
  password: z.string().refine((value) => value.trim().length > 0),
  role: managedUserRoleSchema,
})
export const updateUserSchema = z.strictObject({
  ...userFields,
  id: text,
  password: z.string().optional(),
  role: managedUserRoleSchema.optional(),
})
export const addClassSchema = z.strictObject({
  name: text,
  teacherId: z.string().optional(),
})
export const updateClassSchema = addClassSchema.extend({ id: text })
export const addStudentSchema = z.strictObject({
  nisn: text,
  name: text,
  classId: text,
  gender: z.enum(['L', 'P']),
  parentId: z.string().optional(),
})
export const updateStudentSchema = addStudentSchema
  .omit({ parentId: true })
  .extend({ id: text })
export const bulkImportSchema = z.strictObject({
  kind: z.enum(['teachers', 'students', 'parents']),
  mode: z.enum(['create', 'update']).optional(),
  rows: z.array(z.record(z.string(), z.string())),
})
export const deleteSchema = z.strictObject({ id: text })
