import {
  generateAiSummariesSchema,
  acceptAiSummariesSchema,
  deleteSchema,
} from './schemas'
import { createServerFn } from '@tanstack/react-start'
import { requireTeacher } from '../authorization'
import { and, eq, inArray } from 'drizzle-orm'
import { getDb } from '#/db'
import { aiGenerationLogs, aiSummaries, classes } from '#/db/schema'
import { addDaysIso, weekStartIso } from '../date'
import { DEEPSEEK_MODEL } from '../ai/deepseek'
import { generateWeeklySummaries } from '../ai/weekly-summary'
import {
  MANUAL_MODEL,
  getActiveSummaryStudentIds,
  getClassWeekObservations,
  getClassWeeklyNote,
  getTenantStudents,
  withTenantCache,
} from '../tenant-data'
import { assertTeacherOwnsClass } from './shared'
import type { StudentWeekData } from '../ai/weekly-summary'

export const generateAiSummaries = createServerFn({ method: 'POST' })
  .middleware([requireTeacher])
  .validator(generateAiSummariesSchema)
  .handler(({ data, context }) =>
    withTenantCache(async () => {
      const teacher = context.teacher
      const tenant = teacher.tenant
      await assertTeacherOwnsClass(tenant.id, teacher.id, data.classId)

      const weekStart = weekStartIso(new Date(data.weekStart))
      const weekEnd = addDaysIso(weekStart, 6)
      const classStudents = await getTenantStudents(tenant, [data.classId])
      const studentById = new Map(
        classStudents.map((student) => [student.id, student]),
      )
      const requestedIds = Array.from(new Set(data.studentIds)).filter((id) =>
        studentById.has(id),
      )

      const [activeIds, weekObservations, weeklyNote] = await Promise.all([
        getActiveSummaryStudentIds(tenant, weekStart, requestedIds),
        getClassWeekObservations(tenant, data.classId, weekStart),
        getClassWeeklyNote(tenant, teacher.id, data.classId, weekStart),
      ])

      const skipped: Array<{ studentId: string; reason: string }> = []
      const toGenerate: Array<StudentWeekData> = []
      for (const id of requestedIds) {
        if (activeIds.has(id)) {
          skipped.push({
            studentId: id,
            reason: 'Sudah ada ringkasan aktif untuk minggu ini.',
          })
          continue
        }
        const days = weekObservations.get(id)
        if (!days?.length) {
          skipped.push({
            studentId: id,
            reason: 'Tidak ada data observasi pada minggu ini.',
          })
          continue
        }
        const student = studentById.get(id)
        if (!student) continue
        toGenerate.push({ studentId: id, gender: student.gender, days })
      }

      if (!toGenerate.length) {
        return { drafts: [], skipped }
      }

      const { drafts, usage } = await generateWeeklySummaries(toGenerate, {
        weekStart,
        weekEnd,
        weeklyNote,
        studentNames: classStudents.map((student) => student.name),
      })

      await getDb().insert(aiGenerationLogs).values({
        schoolId: tenant.id,
        teacherId: teacher.id,
        classId: data.classId,
        batchId: crypto.randomUUID(),
        weekStart,
        studentCount: toGenerate.length,
        model: DEEPSEEK_MODEL,
        promptTokens: usage.promptTokens,
        cachedTokens: usage.cachedTokens,
        completionTokens: usage.completionTokens,
        costUsd: usage.costUsd,
      })

      return { drafts, skipped }
    }),
  )

export const acceptAiSummaries = createServerFn({ method: 'POST' })
  .middleware([requireTeacher])
  .validator(acceptAiSummariesSchema)
  .handler(({ data, context }) =>
    withTenantCache(async () => {
      const teacher = context.teacher
      const tenant = teacher.tenant
      await assertTeacherOwnsClass(tenant.id, teacher.id, data.classId)

      const weekStart = weekStartIso(new Date(data.weekStart))
      const classStudents = await getTenantStudents(tenant, [data.classId])
      const classStudentIds = new Set(classStudents.map((item) => item.id))
      const items = data.items.filter(
        (item) => classStudentIds.has(item.studentId) && item.content.trim(),
      )
      if (!items.length) return { saved: [] as Array<string>, skipped: [] }

      const activeIds = await getActiveSummaryStudentIds(
        tenant,
        weekStart,
        items.map((item) => item.studentId),
      )
      // A report saved elsewhere since generation wins; the caller keeps the
      // draft and shows the reason rather than discarding the teacher's work.
      const skipped = items
        .filter((item) => activeIds.has(item.studentId))
        .map((item) => ({
          studentId: item.studentId,
          reason: 'Sudah ada laporan tersimpan untuk minggu ini.',
        }))
      const toSave = items.filter((item) => !activeIds.has(item.studentId))
      if (!toSave.length) return { saved: [] as Array<string>, skipped }

      await getDb()
        .insert(aiSummaries)
        .values(
          toSave.map((item) => ({
            schoolId: tenant.id,
            studentId: item.studentId,
            classId: data.classId,
            teacherId: teacher.id,
            weekStart,
            content: item.content.trim(),
            model: DEEPSEEK_MODEL,
          })),
        )

      return { saved: toSave.map((item) => item.studentId), skipped }
    }),
  )

/** Teacher-written summaries reuse the same table so parents see one feed. */
export const saveManualSummaries = createServerFn({ method: 'POST' })
  .middleware([requireTeacher])
  .validator(acceptAiSummariesSchema)
  .handler(({ data, context }) =>
    withTenantCache(async () => {
      const teacher = context.teacher
      const tenant = teacher.tenant
      await assertTeacherOwnsClass(tenant.id, teacher.id, data.classId)

      const weekStart = weekStartIso(new Date(data.weekStart))
      const classStudents = await getTenantStudents(tenant, [data.classId])
      const classStudentIds = new Set(classStudents.map((item) => item.id))
      const items = data.items.filter(
        (item) => classStudentIds.has(item.studentId) && item.content.trim(),
      )
      if (!items.length) return { saved: [] as Array<string> }

      const db = getDb()
      for (const item of items) {
        const content = item.content.trim()
        const updated = await db
          .update(aiSummaries)
          .set({
            content,
            model: MANUAL_MODEL,
            teacherId: teacher.id,
            classId: data.classId,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(aiSummaries.schoolId, tenant.id),
              eq(aiSummaries.studentId, item.studentId),
              eq(aiSummaries.weekStart, weekStart),
              eq(aiSummaries.status, 'active'),
            ),
          )
          .returning({ id: aiSummaries.id })

        if (!updated.length) {
          await db.insert(aiSummaries).values({
            schoolId: tenant.id,
            studentId: item.studentId,
            classId: data.classId,
            teacherId: teacher.id,
            weekStart,
            content,
            model: MANUAL_MODEL,
          })
        }
      }

      return { saved: items.map((item) => item.studentId) }
    }),
  )

export const revokeAiSummary = createServerFn({ method: 'POST' })
  .middleware([requireTeacher])
  .validator(deleteSchema)
  .handler(({ data, context }) =>
    withTenantCache(async () => {
      const teacher = context.teacher

      await getDb()
        .update(aiSummaries)
        .set({ status: 'revoked', updatedAt: new Date() })
        .where(
          and(
            eq(aiSummaries.id, data.id),
            eq(aiSummaries.schoolId, teacher.tenant.id),
            eq(aiSummaries.teacherId, teacher.id),
            inArray(
              aiSummaries.classId,
              getDb()
                .select({ id: classes.id })
                .from(classes)
                .where(
                  and(
                    eq(classes.schoolId, teacher.tenant.id),
                    eq(classes.teacherId, teacher.id),
                  ),
                ),
            ),
          ),
        )
    }),
  )

export const deleteAiSummary = createServerFn({ method: 'POST' })
  .middleware([requireTeacher])
  .validator(deleteSchema)
  .handler(({ data, context }) =>
    withTenantCache(async () => {
      const teacher = context.teacher

      await getDb()
        .delete(aiSummaries)
        .where(
          and(
            eq(aiSummaries.id, data.id),
            eq(aiSummaries.schoolId, teacher.tenant.id),
            eq(aiSummaries.teacherId, teacher.id),
            inArray(
              aiSummaries.classId,
              getDb()
                .select({ id: classes.id })
                .from(classes)
                .where(
                  and(
                    eq(classes.schoolId, teacher.tenant.id),
                    eq(classes.teacherId, teacher.id),
                  ),
                ),
            ),
          ),
        )
    }),
  )
