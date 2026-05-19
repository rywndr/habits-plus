import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { z } from 'zod'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { BrandLogo } from '#/components/common/brand-logo'
import { loginWithPassword } from '#/server/auth-context'

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email tidak valid.'),
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
})

export function LoginCard() {
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onSubmit: loginSchema,
    },
    onSubmitInvalid: () => {
      setSubmitError('Periksa kembali email dan kata sandi.')
    },
    onSubmit: async ({ value, formApi }) => {
      setSubmitError(null)
      formApi.setErrorMap({})

      try {
        const result = await loginWithPassword({
          data: {
            email: value.email,
            password: value.password,
          },
        })

        await navigate({ to: `/${result.role}` })
      } catch {
        setSubmitError('Email atau kata sandi tidak sesuai.')
      }
    },
  })

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl bg-card p-6 shadow-lg ring-1 ring-foreground/10 sm:p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <BrandLogo size={80} />
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Habits+
          </h1>
          <p className="text-sm text-muted-foreground">
            Masuk dengan akun sekolah Anda
          </p>
        </div>
      </div>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          event.stopPropagation()
          void form.handleSubmit()
        }}
        className="flex flex-col gap-4"
      >
        <form.Field name="email">
          {(field) => (
            <div className="flex flex-col gap-2">
              <Label htmlFor={field.name}>Email</Label>
              <Input
                id={field.name}
                name={field.name}
                type="email"
                placeholder="nama@sekolah.id"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  setSubmitError(null)
                  field.handleChange(event.target.value)
                }}
                required
              />
              {field.state.meta.errors.length ? (
                <p className="text-sm text-destructive">
                  {field.state.meta.errors[0]?.message}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        <form.Field name="password">
          {(field) => (
            <div className="flex flex-col gap-2">
              <Label htmlFor={field.name}>Kata Sandi</Label>
              <Input
                id={field.name}
                name={field.name}
                type="password"
                placeholder="********"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => {
                  setSubmitError(null)
                  field.handleChange(event.target.value)
                }}
                required
              />
              {field.state.meta.errors.length ? (
                <p className="text-sm text-destructive">
                  {field.state.meta.errors[0]?.message}
                </p>
              ) : null}
            </div>
          )}
        </form.Field>

        {submitError ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {submitError}
          </p>
        ) : null}
        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <Button
              type="submit"
              size="lg"
              className="mt-2 w-full"
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? 'Memeriksa...' : 'Masuk'}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </div>
  )
}
