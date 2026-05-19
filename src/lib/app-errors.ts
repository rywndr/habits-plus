import type { Role } from '#/db/schema'
import { roleLabels } from './domain'

export class TenantNotFoundError extends Error {
  constructor(slug: string) {
    super(
      `Sekolah "${slug}" belum terdaftar. Periksa kembali alamat sekolah atau hubungi pengelola Habits+.`,
    )
    this.name = 'TenantNotFoundError'
  }
}

export class MissingTenantRoleError extends Error {
  constructor(slug: string, role: Role) {
    super(
      `Akun ${roleLabels[role]} untuk sekolah "${slug}" belum dibuat. Hubungi pengelola Habits+ untuk menambahkan akun terlebih dahulu.`,
    )
    this.name = 'MissingTenantRoleError'
  }
}

export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message

  return 'Terjadi kendala saat memuat data. Silakan coba lagi atau hubungi pengelola Habits+.'
}
