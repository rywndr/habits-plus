import type { FormEvent, ReactElement, ReactNode } from 'react'
import { useState } from 'react'
import { ArrowLeft, LoaderCircle } from 'lucide-react'
import { ContentPanel } from '#/components/shell/content-panel'
import { PageHeader } from '#/components/shell/page-header'
import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { Skeleton } from '#/components/ui/skeleton'

type SubmissionState =
  { kind: 'idle' } | { kind: 'saving' } | { kind: 'error'; message: string }

type EntityFormPageProps = {
  title: string
  description: string
  cancelLink: ReactElement
  children: ReactNode
  onSubmit: () => Promise<void>
  submitLabel?: string
  submitDisabled?: boolean
}

function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Data tidak dapat disimpan. Coba lagi.'
}

export function EntityFormPage({
  title,
  description,
  cancelLink,
  children,
  onSubmit,
  submitLabel = 'Simpan',
  submitDisabled = false,
}: EntityFormPageProps) {
  const [submission, setSubmission] = useState<SubmissionState>({
    kind: 'idle',
  })
  const isSaving = submission.kind === 'saving'

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (isSaving) return

    setSubmission({ kind: 'saving' })
    try {
      await onSubmit()
    } catch (error) {
      setSubmission({ kind: 'error', message: errorMessage(error) })
    }
  }

  return (
    <ContentPanel>
      <main className="flex w-full max-w-4xl flex-col gap-6 sm:gap-8">
        <div className="flex flex-col gap-4">
          <Button
            render={cancelLink}
            nativeButton={false}
            variant="ghost"
            className="w-fit gap-2 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
          >
            <ArrowLeft />
            Kembali
          </Button>
          <div className="space-y-2">
            <PageHeader
              title={title}
              className="text-2xl leading-tight sm:text-4xl"
            />
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {description}
            </p>
          </div>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)}>
          <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/5">
            <div className="grid gap-5 p-4 sm:grid-cols-2 sm:p-6 lg:p-8">
              {children}
            </div>

            {submission.kind === 'error' ? (
              <div className="px-4 pb-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8">
                <div
                  className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive"
                  role="alert"
                >
                  <p className="font-medium">Gagal menyimpan</p>
                  <p className="mt-1 leading-5">{submission.message}</p>
                </div>
              </div>
            ) : null}

            <div className="flex flex-col-reverse gap-3 border-t bg-muted/30 p-4 sm:flex-row sm:justify-end sm:px-6 lg:px-8">
              <Button
                render={cancelLink}
                nativeButton={false}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="w-full gap-2 sm:w-auto"
                disabled={isSaving || submitDisabled}
              >
                {isSaving ? <LoaderCircle className="animate-spin" /> : null}
                {isSaving ? 'Menyimpan...' : submitLabel}
              </Button>
            </div>
          </div>
        </form>
      </main>
    </ContentPanel>
  )
}

type FormFieldProps = {
  htmlFor?: string
  label: string
  hint?: string
  className?: string
  children: ReactNode
}

type EntityNotFoundPageProps = {
  entityLabel: string
  backLink: ReactElement
}

export function EntityNotFoundPage({
  entityLabel,
  backLink,
}: EntityNotFoundPageProps) {
  return (
    <ContentPanel>
      <main className="mx-auto flex min-h-[60svh] w-full max-w-2xl items-center justify-center">
        <div className="w-full rounded-2xl bg-card p-6 text-center ring-1 ring-foreground/5 sm:p-10">
          <p className="font-heading text-2xl font-semibold sm:text-3xl">
            Data tidak ditemukan
          </p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
            {entityLabel} ini mungkin sudah dihapus atau tautannya tidak lagi
            berlaku.
          </p>
          <Button render={backLink} nativeButton={false} className="mt-6 gap-2">
            <ArrowLeft />
            Kembali ke daftar
          </Button>
        </div>
      </main>
    </ContentPanel>
  )
}

export function FormField({
  htmlFor,
  label,
  hint,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={`flex min-w-0 flex-col gap-2 ${className ?? ''}`}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? (
        <p className="text-xs leading-5 text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export function EntityFormPageSkeleton() {
  return (
    <ContentPanel>
      <div className="flex w-full max-w-4xl flex-col gap-8">
        <div className="space-y-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-10 w-64 max-w-full" />
          <Skeleton className="h-5 w-[32rem] max-w-full" />
        </div>
        <div className="rounded-2xl bg-card p-4 ring-1 ring-foreground/5 sm:p-6 lg:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </ContentPanel>
  )
}
