import {
  date,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { frequencyEnum, indicatorEnum } from './enums'
import { schools } from './schools'
import { users } from './auth'
import { classes, students } from './academics'

export const dailyObservations = pgTable(
  'daily_observations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    studentId: uuid('student_id')
      .notNull()
      .references(() => students.id, { onDelete: 'cascade' }),
    teacherId: uuid('teacher_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    observedAt: date('observed_at').notNull(),
    note: text('note'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    studentDateIdx: uniqueIndex('daily_observations_student_date_idx').on(
      table.studentId,
      table.observedAt,
    ),
  }),
)

export const observationScores = pgTable(
  'observation_scores',
  {
    observationId: uuid('observation_id')
      .notNull()
      .references(() => dailyObservations.id, { onDelete: 'cascade' }),
    indicator: indicatorEnum('indicator').notNull(),
    frequency: frequencyEnum('frequency').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.observationId, table.indicator] }),
  }),
)

export const weeklyNotes = pgTable(
  'weekly_notes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    teacherId: uuid('teacher_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    classId: uuid('class_id').references(() => classes.id, {
      onDelete: 'cascade',
    }),
    weekStart: date('week_start').notNull(),
    p1: text('p1').notNull(),
    p2: text('p2').notNull(),
    p3: text('p3').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    teacherClassWeekIdx: uniqueIndex('weekly_notes_teacher_class_week_idx').on(
      table.schoolId,
      table.teacherId,
      table.classId,
      table.weekStart,
    ),
  }),
)

export const monthlySummaries = pgTable(
  'monthly_summaries',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    teacherId: uuid('teacher_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    classId: uuid('class_id').references(() => classes.id, {
      onDelete: 'cascade',
    }),
    monthStart: date('month_start').notNull(),
    text: text('text').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    teacherClassMonthIdx: uniqueIndex(
      'monthly_summaries_teacher_class_month_idx',
    ).on(table.schoolId, table.teacherId, table.classId, table.monthStart),
  }),
)
