import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { getDb } from '#/db'
import { aiGenerationLogs, aiSummaries } from '#/db/schema'
import { addDaysIso, weekStartIso } from '../date'
import { DEEPSEEK_MODEL } from '../ai/deepseek'
import { generateWeeklySummaries } from '../ai/weekly-summary'
import {
  getActiveSummaryStudentIds,
  getClassWeekObservations,
  getClassWeeklyNote,
  getTenantStudents,
  withTenantCache,
} from '../tenant-data'
import { assertTeacherOwnsClass } from './shared'
import type { StudentWeekData } from '../ai/weekly-summary'

type GenerateInput = {
  weekStart: string
  classId: string
  studentIds: Array<string>
}

type AcceptInput = {
  weekStart: string
  classId: string
  items: Array<{ studentId: string; content: string }>
}

type SummaryIdInput = {
  id: string
}

export type GenerateBatchCost = {
  promptTokens: number
  cachedTokens: number
  completionTokens: number
  costUsd: number
}

export const generateAiSummaries = createServerFn({ method: 'POST' })
  .inputValidator((data: GenerateInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('../auth.server')
      const teacher = await getAuthenticatedUserByRole('guru')
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
        return { drafts: [], skipped, cost: null }
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

      const cost: GenerateBatchCost = { ...usage }
      return { drafts, skipped, cost }
    }),
  )

export const acceptAiSummaries = createServerFn({ method: 'POST' })
  .inputValidator((data: AcceptInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('../auth.server')
      const teacher = await getAuthenticatedUserByRole('guru')
      const tenant = teacher.tenant
      await assertTeacherOwnsClass(tenant.id, teacher.id, data.classId)

      const weekStart = weekStartIso(new Date(data.weekStart))
      const classStudents = await getTenantStudents(tenant, [data.classId])
      const classStudentIds = new Set(classStudents.map((item) => item.id))
      const items = data.items.filter(
        (item) => classStudentIds.has(item.studentId) && item.content.trim(),
      )
      if (!items.length) return { saved: [] as Array<string> }

      const activeIds = await getActiveSummaryStudentIds(
        tenant,
        weekStart,
        items.map((item) => item.studentId),
      )
      const toSave = items.filter((item) => !activeIds.has(item.studentId))
      if (!toSave.length) return { saved: [] as Array<string> }

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

      return { saved: toSave.map((item) => item.studentId) }
    }),
  )

export const revokeAiSummary = createServerFn({ method: 'POST' })
  .inputValidator((data: SummaryIdInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('../auth.server')
      const teacher = await getAuthenticatedUserByRole('guru')

      await getDb()
        .update(aiSummaries)
        .set({ status: 'revoked', updatedAt: new Date() })
        .where(
          and(
            eq(aiSummaries.id, data.id),
            eq(aiSummaries.schoolId, teacher.tenant.id),
          ),
        )
    }),
  )

export const deleteAiSummary = createServerFn({ method: 'POST' })
  .inputValidator((data: SummaryIdInput) => data)
  .handler(({ data }) =>
    withTenantCache(async () => {
      const { getAuthenticatedUserByRole } = await import('../auth.server')
      const teacher = await getAuthenticatedUserByRole('guru')

      await getDb()
        .delete(aiSummaries)
        .where(
          and(
            eq(aiSummaries.id, data.id),
            eq(aiSummaries.schoolId, teacher.tenant.id),
          ),
        )
    }),
  )
