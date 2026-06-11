import {
  date,
  doublePrecision,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import { schools } from './schools'
import { users } from './auth'
import { classes, students } from './academics'

export const aiSummaryStatusEnum = pgEnum('ai_summary_status', [
  'active',
  'revoked',
])

export type AiSummaryStatus = (typeof aiSummaryStatusEnum.enumValues)[number]

export const aiSummaries = pgTable(
  'ai_summaries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    classId: uuid('class_id').references(() => classes.id, {
      onDelete: 'set null',
    }),
    teacherId: uuid('teacher_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    weekStart: date('week_start').notNull(),
    content: text('content').notNull(),
    status: aiSummaryStatusEnum('status').notNull().default('active'),
    model: text('model').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    // One *active* summary per student per week; revoked rows stay as history.
    activeStudentWeekIdx: uniqueIndex('ai_summaries_student_week_active_idx')
      .on(table.studentId, table.weekStart)
      .where(sql`${table.status} = 'active'`),
  }),
)

export const aiGenerationLogs = pgTable('ai_generation_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  schoolId: uuid('school_id')
    .notNull()
    .references(() => schools.id, { onDelete: 'cascade' }),
  teacherId: uuid('teacher_id').references(() => users.id, {
    onDelete: 'set null',
  }),
  classId: uuid('class_id').references(() => classes.id, {
    onDelete: 'set null',
  }),
  batchId: uuid('batch_id').notNull(),
  weekStart: date('week_start').notNull(),
  studentCount: integer('student_count').notNull(),
  model: text('model').notNull(),
  promptTokens: integer('prompt_tokens').notNull(),
  cachedTokens: integer('cached_tokens').notNull().default(0),
  completionTokens: integer('completion_tokens').notNull(),
  costUsd: doublePrecision('cost_usd').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
})
