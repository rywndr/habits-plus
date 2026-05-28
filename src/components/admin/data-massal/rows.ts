import { ALL_CLASSES } from './templates'
import type { ImportKind } from './templates'
import type { AppUser, ClassRoom, Student } from '#/server/tenant-data'

export type TenantData = {
  users: Array<AppUser>
  students: Array<Student>
  classes: Array<ClassRoom>
}

export function buildFilledRows(
  kind: ImportKind,
  classId: string,
  data: TenantData,
): Array<Array<string>> {
  if (kind === 'teachers') {
    const teachers = data.users.filter((user) => user.role === 'guru')
    const filtered =
      classId === ALL_CLASSES
        ? teachers
        : teachers.filter((teacher) => teacher.classIds?.includes(classId))
    return filtered.map((teacher) => [
      teacher.name,
      teacher.email,
      (teacher.classNames ?? []).join('|'),
    ])
  }

  if (kind === 'students') {
    const filtered =
      classId === ALL_CLASSES
        ? data.students
        : data.students.filter((student) => student.classId === classId)
    return filtered.map((student) => [
      student.nisn,
      student.name,
      data.classes.find((c) => c.id === student.classId)?.name ?? '',
      student.gender,
    ])
  }

  const parents = data.users.filter((user) => user.role === 'ortu')
  const studentById = new Map(data.students.map((s) => [s.id, s]))
  const filtered =
    classId === ALL_CLASSES
      ? parents
      : parents.filter((parent) => {
          const student = parent.studentId
            ? studentById.get(parent.studentId)
            : undefined
          return student?.classId === classId
        })
  return filtered.map((parent) => {
    const student = parent.studentId
      ? studentById.get(parent.studentId)
      : undefined
    return [parent.name, parent.email, student?.nisn ?? '']
  })
}

function signatureOf(
  row: Record<string, string>,
  kind: ImportKind,
  data: TenantData,
  source: 'uploaded' | 'existing',
): string | null {
  if (kind === 'students') {
    const classNameById = new Map(data.classes.map((c) => [c.id, c.name]))
    if (source === 'uploaded') {
      return JSON.stringify({
        name: row.name.trim(),
        gender: row.gender.trim(),
        className: row.class_name.trim(),
      })
    }
    const nisn = row.nisn.trim()
    const existing = data.students.find((s) => s.nisn === nisn)
    if (!existing) return null
    return JSON.stringify({
      name: existing.name.trim(),
      gender: existing.gender.trim(),
      className: (classNameById.get(existing.classId) ?? '').trim(),
    })
  }

  const role = kind === 'teachers' ? 'guru' : 'ortu'

  if (kind === 'teachers') {
    if (source === 'uploaded') {
      return JSON.stringify({
        name: row.name.trim(),
        classes: normalizeClassList(row.class_names.split('|')),
      })
    }
    const email = row.email.trim().toLowerCase()
    const existing = data.users.find(
      (u) => u.role === role && u.email.toLowerCase() === email,
    )
    if (!existing) return null
    return JSON.stringify({
      name: existing.name.trim(),
      classes: normalizeClassList(existing.classNames ?? []),
    })
  }

  const nisnById = new Map(data.students.map((s) => [s.id, s.nisn]))
  if (source === 'uploaded') {
    return JSON.stringify({
      name: row.name.trim(),
      studentNisn: row.student_nisn.trim(),
    })
  }
  const email = row.email.trim().toLowerCase()
  const existing = data.users.find(
    (u) => u.role === role && u.email.toLowerCase() === email,
  )
  if (!existing) return null
  return JSON.stringify({
    name: existing.name.trim(),
    studentNisn: existing.studentId
      ? (nisnById.get(existing.studentId) ?? '')
      : '',
  })
}

function normalizeClassList(values: Array<string>) {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .sort()
}

export function diffChangedRows(
  uploaded: Array<Record<string, string>>,
  kind: ImportKind,
  data: TenantData,
): { changed: Array<Record<string, string>>; unchanged: number } {
  const changed: Array<Record<string, string>> = []
  let unchanged = 0

  for (const row of uploaded) {
    const existingSignature = signatureOf(row, kind, data, 'existing')
    if (existingSignature === null) {
      changed.push(row)
      continue
    }
    const uploadedSignature = signatureOf(row, kind, data, 'uploaded')
    if (uploadedSignature === existingSignature) {
      unchanged += 1
    } else {
      changed.push(row)
    }
  }

  return { changed, unchanged }
}
