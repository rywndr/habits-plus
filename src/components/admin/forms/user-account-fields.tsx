import { FormField } from '#/components/admin/entity-form-page'
import { Input } from '#/components/ui/input'

export type UserAccountFormValues = {
  name: string
  email: string
  password: string
}

type UserAccountFieldsProps<T extends UserAccountFormValues> = {
  values: T
  onChange: (values: T) => void
  idPrefix: string
  isEditing?: boolean
}

export function UserAccountFields<T extends UserAccountFormValues>({
  values,
  onChange,
  idPrefix,
  isEditing = false,
}: UserAccountFieldsProps<T>) {
  return (
    <>
      <FormField htmlFor={`${idPrefix}-name`} label="Nama">
        <Input
          id={`${idPrefix}-name`}
          name="name"
          value={values.name}
          onChange={(event) =>
            onChange({ ...values, name: event.target.value })
          }
          placeholder="Nama lengkap"
          autoComplete="name"
          required
        />
      </FormField>
      <FormField htmlFor={`${idPrefix}-email`} label="Email">
        <Input
          id={`${idPrefix}-email`}
          name="email"
          type="email"
          value={values.email}
          onChange={(event) =>
            onChange({ ...values, email: event.target.value })
          }
          placeholder="nama@sekolah.id"
          autoComplete="email"
          required
        />
      </FormField>
      <FormField
        htmlFor={`${idPrefix}-password`}
        label={isEditing ? 'Kata sandi baru' : 'Kata sandi awal'}
        hint={isEditing ? 'Kosongkan jika kata sandi tidak diubah.' : undefined}
      >
        <Input
          id={`${idPrefix}-password`}
          name="password"
          type="password"
          value={values.password}
          onChange={(event) =>
            onChange({ ...values, password: event.target.value })
          }
          placeholder={isEditing ? 'Tidak diubah' : 'Minimal 8 karakter'}
          autoComplete="new-password"
          minLength={isEditing && !values.password ? undefined : 8}
          required={!isEditing}
        />
      </FormField>
    </>
  )
}
