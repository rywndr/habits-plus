import { pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { genderEnum } from './enums'
import { schools } from './schools'
import { users } from './auth'

export const classes = pgTable(
  'classes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    teacherId: uuid('teacher_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    schoolNameIdx: uniqueIndex('classes_school_name_idx').on(
      table.schoolId,
      table.name,
    ),
  }),
)

export const students = pgTable(
  'students',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    schoolId: uuid('school_id')
      .notNull()
      .references(() => schools.id, { onDelete: 'cascade' }),
    classId: uuid('class_id')
      .notNull()
      .references(() => classes.id, { onDelete: 'restrict' }),
    parentId: uuid('parent_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    nisn: text('nisn').notNull(),
    name: text('name').notNull(),
    gender: genderEnum('gender').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    schoolNisnIdx: uniqueIndex('students_school_nisn_idx').on(
      table.schoolId,
      table.nisn,
    ),
  }),
)
