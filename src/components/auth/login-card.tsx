import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Eye, EyeOff, LoaderCircle, Lock, Mail } from 'lucide-react'
import { z } from 'zod'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { BrandLogo } from '#/components/common/brand-logo'
import { authClient } from '#/lib/auth-client'

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email tidak valid.'),
  password: z.string().min(1, 'Kata sandi wajib diisi.'),
})

export function LoginCard() {
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
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

      const result = await authClient.signIn.email({
        email: value.email,
        password: value.password,
        rememberMe: false,
      })

      if (result.error || !result.data?.user) {
        setSubmitError('Email atau kata sandi tidak sesuai.')
        return
      }

      const role = (result.data.user as { role?: string }).role
      if (!role) {
        setSubmitError('Sesi berhasil dibuat, tetapi peran pengguna tidak ditemukan.')
        return
      }

      window.location.assign(`/${role}`)
    },
  })

  return (
    <div className="relative mx-auto w-full max-w-md pt-12 sm:pt-14">
      <BrandLogo
        size={104}
        className="absolute left-1/2 top-0 -translate-x-1/2 ring-4 ring-brand-navy"
      />

      <div className="flex flex-col gap-6 rounded-3xl bg-card p-6 pt-16 shadow-2xl ring-1 ring-foreground/10 sm:p-8 sm:pt-20">
        <div className="flex flex-col items-center gap-1.5 text-center">
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Selamat datang
          </h1>
          <p className="text-sm text-muted-foreground">
            Masuk untuk melanjutkan ke Habits+
          </p>
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
                <div className="relative">
                  <Mail
                    aria-hidden
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id={field.name}
                    name={field.name}
                    type="email"
                    autoComplete="email"
                    placeholder="nama@sekolah.id"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      setSubmitError(null)
                      field.handleChange(event.target.value)
                    }}
                    className="h-11 pl-10"
                    required
                  />
                </div>
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
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.name}>Kata Sandi</Label>
                  <a
                    href="/forgot-password"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Lupa kata sandi?
                  </a>
                </div>
                <div className="relative">
                  <Lock
                    aria-hidden
                    className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id={field.name}
                    name={field.name}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="********"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(event) => {
                      setSubmitError(null)
                      field.handleChange(event.target.value)
                    }}
                    className="h-11 pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword
                        ? 'Sembunyikan kata sandi'
                        : 'Tampilkan kata sandi'
                    }
                    className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" />
                    ) : (
                      <Eye className="size-4" />
                    )}
                  </button>
                </div>
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
                className="mt-2 h-11 w-full gap-2"
                disabled={!canSubmit || isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <LoaderCircle aria-hidden className="size-4 animate-spin" />
                ) : null}
                Masuk
              </Button>
            )}
          </form.Subscribe>
        </form>
      </div>
    </div>
  )
}
