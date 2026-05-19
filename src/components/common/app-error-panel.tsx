import { Link } from '@tanstack/react-router'
import { AlertTriangle, Home, RotateCcw } from 'lucide-react'
import { buttonVariants, Button } from '#/components/ui/button'
import { cn } from '#/lib/utils'
import { getFriendlyErrorMessage } from '#/lib/app-errors'

type Props = {
  error: unknown
  reset?: () => void
}

export function AppErrorPanel({ error, reset }: Props) {
  return (
    <main className="grid min-h-svh place-items-center bg-brand-panel p-4">
      <div className="flex w-full max-w-xl flex-col gap-5 rounded-2xl bg-card p-6 text-center shadow-sm ring-1 ring-foreground/10">
        <div className="mx-auto grid size-12 place-items-center rounded-full bg-brand-orange/15 text-brand-orange">
          <AlertTriangle className="size-6" />
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Data belum siap
          </h1>
          <p className="text-sm leading-6 text-muted-foreground">
            {getFriendlyErrorMessage(error)}
          </p>
        </div>

        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          {reset ? (
            <Button
              type="button"
              variant="secondary"
              className="gap-2"
              onClick={reset}
            >
              <RotateCcw />
              Coba lagi
            </Button>
          ) : null}
          <Link to="/" className={cn(buttonVariants(), 'gap-2')}>
            <Home />
            Ke halaman awal
          </Link>
        </div>
      </div>
    </main>
  )
}
