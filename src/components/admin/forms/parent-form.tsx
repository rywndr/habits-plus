import { useState } from 'react'
import { Check, ChevronDown, X } from 'lucide-react'
import { FormField } from '#/components/admin/entity-form-page'
import { SearchInput } from '#/components/common/search-input'
import { Button } from '#/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '#/components/ui/select'
import type { AppUser, ClassRoom, Student } from '#/server/tenant-data'
import { UserAccountFields } from './user-account-fields'
import type { UserAccountFormValues } from './user-account-fields'

export type ParentFormValues = UserAccountFormValues & {
  studentId: string
}

type ParentFormProps = {
  students: Array<Student>
  classes: Array<ClassRoom>
  values: ParentFormValues
  onChange: (values: ParentFormValues) => void
  idPrefix: string
  isEditing?: boolean
}

export function parentFormValues(parent?: AppUser): ParentFormValues {
  return {
    name: parent?.name ?? '',
    email: parent?.email ?? '',
    password: '',
    studentId: parent?.studentId ?? 'none',
  }
}

export function ParentForm({
  students,
  classes,
  values,
  onChange,
  idPrefix,
  isEditing = false,
}: ParentFormProps) {
  return (
    <>
      <UserAccountFields
        values={values}
        onChange={onChange}
        idPrefix={idPrefix}
        isEditing={isEditing}
      />
      <StudentField
        students={students}
        classes={classes}
        value={values.studentId}
        onChange={(studentId) => onChange({ ...values, studentId })}
      />
    </>
  )
}

type StudentFieldProps = {
  students: Array<Student>
  classes: Array<ClassRoom>
  value: string
  onChange: (value: string) => void
}

function classNameOf(id: string, classes: Array<ClassRoom>) {
  return classes.find((klass) => klass.id === id)?.name ?? '-'
}

function StudentField({
  students,
  classes,
  value,
  onChange,
}: StudentFieldProps) {
  const [query, setQuery] = useState('')
  const [classFilter, setClassFilter] = useState('all')
  const selectedStudent = students.find((student) => student.id === value)
  const normalizedQuery = query.trim().toLowerCase()
  const filteredStudents = students.filter((student) => {
    const matchesClass =
      classFilter === 'all' || student.classId === classFilter
    const matchesQuery =
      !normalizedQuery ||
      student.name.toLowerCase().includes(normalizedQuery) ||
      student.nisn.toLowerCase().includes(normalizedQuery)

    return matchesClass && matchesQuery
  })

  return (
    <FormField label="Anak" className="sm:col-span-2">
      <Popover>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              className="h-auto min-h-10 w-full justify-between gap-2 bg-card text-left font-normal"
            />
          }
        >
          <span className="min-w-0 flex-1 truncate">
            {selectedStudent
              ? `${selectedStudent.name} (${classNameOf(selectedStudent.classId, classes)})`
              : 'Belum ditautkan'}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-96 max-w-[90vw] gap-3 p-3">
          <div className="grid gap-2">
            <Select
              value={classFilter}
              onValueChange={(nextValue) => setClassFilter(nextValue || 'all')}
            >
              <SelectTrigger className="w-full">
                <span className="min-w-0 flex-1 truncate text-left">
                  {classFilter === 'all'
                    ? 'Semua kelas'
                    : classNameOf(classFilter, classes)}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua kelas</SelectItem>
                {classes.map((klass) => (
                  <SelectItem key={klass.id} value={klass.id}>
                    {klass.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <SearchInput
              value={query}
              onValueChange={setQuery}
              placeholder="Cari nama atau NISN..."
              containerClassName="sm:max-w-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto pr-1">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              onClick={() => onChange('none')}
            >
              <span className="grid size-4 shrink-0 place-items-center rounded-sm border border-border">
                {value === 'none' ? <Check className="size-3" /> : null}
              </span>
              <span className="min-w-0 flex-1 truncate">Belum ditautkan</span>
            </button>
            {filteredStudents.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                Tidak ada siswa.
              </p>
            ) : (
              filteredStudents.map((student) => {
                const isSelected = student.id === value

                return (
                  <button
                    key={student.id}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                    onClick={() => onChange(student.id)}
                  >
                    <span className="grid size-4 shrink-0 place-items-center rounded-sm border border-border">
                      {isSelected ? <Check className="size-3" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{student.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {student.nisn} - {classNameOf(student.classId, classes)}
                      </span>
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
      {selectedStudent ? (
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">
            <span className="truncate">
              {selectedStudent.name} -{' '}
              {classNameOf(selectedStudent.classId, classes)}
            </span>
            <button
              type="button"
              aria-label={`Hapus tautan ${selectedStudent.name}`}
              className="rounded-full text-muted-foreground hover:text-foreground"
              onClick={() => onChange('none')}
            >
              <X className="size-3" />
            </button>
          </span>
        </div>
      ) : null}
    </FormField>
  )
}
