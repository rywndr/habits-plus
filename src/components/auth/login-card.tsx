import { useState  } from 'react'
import type {FormEvent} from 'react';
import { Link, useNavigate } from '@tanstack/react-router'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { BrandLogo } from '#/components/common/brand-logo'

type Props = {
  tenant: string
  tenantName: string
}

export function LoginCard({ tenant, tenantName }: Props) {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void navigate({ to: '/$tenant/guru', params: { tenant } })
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-2xl bg-card p-6 shadow-lg ring-1 ring-foreground/10 sm:p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <BrandLogo size={80} />
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Habits+
          </h1>
          <p className="text-sm text-muted-foreground">{tenantName}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="nama@sekolah.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">Kata Sandi</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" size="lg" className="mt-2 w-full">
          Masuk
        </Button>
      </form>

      <div className="flex flex-col items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <span>Lihat tampilan lain (demo):</span>
        <div className="flex gap-3 text-sm">
          <Link
            to="/$tenant/admin"
            params={{ tenant }}
            className="text-brand-navy underline-offset-4 hover:underline"
          >
            Admin
          </Link>
          <Link
            to="/$tenant/ortu"
            params={{ tenant }}
            className="text-brand-navy underline-offset-4 hover:underline"
          >
            Orang Tua
          </Link>
        </div>
      </div>
    </div>
  )
}
