import { relations } from 'drizzle-orm'
import { classes, students } from './academics'
import { dailyObservations, observationScores, weeklyNotes } from './observations'
import { schools } from './schools'
import { users } from './auth'

export const schoolsRelations = relations(schools, ({ many }) => ({
  users: many(users),
  classes: many(classes),
  students: many(students),
}))

export const usersRelations = relations(users, ({ one, many }) => ({
  school: one(schools, {
    fields: [users.schoolId],
    references: [schools.id],
  }),
  classes: many(classes),
  children: many(students),
}))

export const classesRelations = relations(classes, ({ one, many }) => ({
  school: one(schools, {
    fields: [classes.schoolId],
    references: [schools.id],
  }),
  teacher: one(users, {
    fields: [classes.teacherId],
    references: [users.id],
  }),
  students: many(students),
}))

export const studentsRelations = relations(students, ({ one, many }) => ({
  school: one(schools, {
    fields: [students.schoolId],
    references: [schools.id],
  }),
  class: one(classes, {
    fields: [students.classId],
    references: [classes.id],
  }),
  parent: one(users, {
    fields: [students.parentId],
    references: [users.id],
  }),
  observations: many(dailyObservations),
}))

export const dailyObservationsRelations = relations(
  dailyObservations,
  ({ one, many }) => ({
    school: one(schools, {
      fields: [dailyObservations.schoolId],
      references: [schools.id],
    }),
    student: one(students, {
      fields: [dailyObservations.studentId],
      references: [students.id],
    }),
    teacher: one(users, {
      fields: [dailyObservations.teacherId],
      references: [users.id],
    }),
    scores: many(observationScores),
  }),
)

export const observationScoresRelations = relations(
  observationScores,
  ({ one }) => ({
    observation: one(dailyObservations, {
      fields: [observationScores.observationId],
      references: [dailyObservations.id],
    }),
  }),
)

export const weeklyNotesRelations = relations(weeklyNotes, ({ one }) => ({
  school: one(schools, {
    fields: [weeklyNotes.schoolId],
    references: [schools.id],
  }),
  teacher: one(users, {
    fields: [weeklyNotes.teacherId],
    references: [users.id],
  }),
}))
