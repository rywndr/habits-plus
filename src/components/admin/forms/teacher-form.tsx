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
import type { AppUser, ClassRoom } from '#/server/tenant-data'
import { UserAccountFields } from './user-account-fields'
import type { UserAccountFormValues } from './user-account-fields'

export type TeacherFormValues = UserAccountFormValues & {
  classIds: Array<string>
}

type TeacherFormProps = {
  classes: Array<ClassRoom>
  values: TeacherFormValues
  onChange: (values: TeacherFormValues) => void
  idPrefix: string
  isEditing?: boolean
}

export function teacherFormValues(teacher?: AppUser): TeacherFormValues {
  return {
    name: teacher?.name ?? '',
    email: teacher?.email ?? '',
    password: '',
    classIds: teacher?.classIds ?? [],
  }
}

export function TeacherForm({
  classes,
  values,
  onChange,
  idPrefix,
  isEditing = false,
}: TeacherFormProps) {
  return (
    <>
      <UserAccountFields
        values={values}
        onChange={onChange}
        idPrefix={idPrefix}
        isEditing={isEditing}
      />
      <ClassAssignmentField
        classes={classes}
        value={values.classIds}
        onChange={(classIds) => onChange({ ...values, classIds })}
      />
    </>
  )
}

type ClassAssignmentFieldProps = {
  classes: Array<ClassRoom>
  value: Array<string>
  onChange: (value: Array<string>) => void
}

function ClassAssignmentField({
  classes,
  value,
  onChange,
}: ClassAssignmentFieldProps) {
  const [query, setQuery] = useState('')
  const selectedClasses = classes.filter((klass) => value.includes(klass.id))
  const normalizedQuery = query.trim().toLowerCase()
  const filteredClasses = classes.filter((klass) =>
    klass.name.toLowerCase().includes(normalizedQuery),
  )

  function toggleClass(id: string) {
    onChange(
      value.includes(id)
        ? value.filter((classId) => classId !== id)
        : [...value, id],
    )
  }

  return (
    <FormField label="Kelas yang diampu" className="sm:col-span-2">
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
            {selectedClasses.length
              ? `${selectedClasses.length} kelas dipilih`
              : 'Pilih kelas'}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 max-w-[90vw] gap-3 p-3">
          <SearchInput
            value={query}
            onValueChange={setQuery}
            placeholder="Cari kelas..."
            containerClassName="sm:max-w-none"
          />
          <div className="max-h-60 overflow-y-auto pr-1">
            {filteredClasses.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                Tidak ada kelas.
              </p>
            ) : (
              filteredClasses.map((klass) => {
                const isSelected = value.includes(klass.id)

                return (
                  <button
                    key={klass.id}
                    type="button"
                    className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                    onClick={() => toggleClass(klass.id)}
                  >
                    <span className="grid size-4 shrink-0 place-items-center rounded-sm border border-border">
                      {isSelected ? <Check className="size-3" /> : null}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {klass.name}
                    </span>
                  </button>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
      {selectedClasses.length ? (
        <div className="flex flex-wrap gap-2">
          {selectedClasses.map((klass) => (
            <span
              key={klass.id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
            >
              <span className="truncate">{klass.name}</span>
              <button
                type="button"
                aria-label={`Hapus ${klass.name}`}
                className="rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => toggleClass(klass.id)}
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </FormField>
  )
}
