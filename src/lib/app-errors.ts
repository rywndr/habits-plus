export class TenantNotFoundError extends Error {
  constructor(slug: string) {
    super(
      `Sekolah "${slug}" belum terdaftar. Periksa kembali alamat sekolah atau hubungi pengelola Habits+.`,
    )
    this.name = 'TenantNotFoundError'
  }
}

export function getFriendlyErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message

  return 'Terjadi kendala saat memuat data. Silakan coba lagi atau hubungi pengelola Habits+.'
}
