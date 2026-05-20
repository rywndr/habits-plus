import { LoaderCircle } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import type { ComponentProps } from 'react'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type Props = Omit<ComponentProps<typeof Button>, 'children'> & {
  status: SaveStatus
  successMessage?: string
  errorMessage?: string
  wrapperClassName?: string
  statusClassName?: string
}

export function SaveButton({
  status,
  successMessage = 'Data berhasil disimpan.',
  errorMessage = 'Data gagal disimpan. Coba lagi.',
  className,
  wrapperClassName,
  statusClassName,
  disabled,
  ...props
}: Props) {
  const isSaving = status === 'saving'
  const message =
    status === 'saved'
      ? successMessage
      : status === 'error'
        ? errorMessage
        : ''

  return (
    <div
      className={cn(
        'flex shrink-0 flex-col items-start gap-1',
        wrapperClassName,
      )}
    >
      <Button
        className={cn('gap-2', className)}
        disabled={disabled || isSaving}
        aria-busy={isSaving}
        {...props}
      >
        {isSaving ? (
          <LoaderCircle aria-hidden className="size-4 animate-spin" />
        ) : null}
        Simpan
      </Button>
      <p
        role={status === 'idle' ? undefined : 'status'}
        className={cn(
          'min-h-4 whitespace-nowrap text-xs',
          status === 'saved' ? 'text-emerald-700' : null,
          status === 'error' ? 'text-destructive' : null,
          statusClassName,
        )}
      >
        {message}
      </p>
    </div>
  )
}
