export function formatIndonesianDate(value: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export function formatIndonesianMonth(value: string | Date): string {
  return new Intl.DateTimeFormat('id-ID', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export function toIsoDate(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayIso(): string {
  return toIsoDate(new Date())
}

export function weekStartIso(value = new Date()): string {
  const date = new Date(value)
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return toIsoDate(date)
}

export function addDaysIso(value: string, days: number): string {
  const date = new Date(value)
  date.setDate(date.getDate() + days)
  return toIsoDate(date)
}

export function weekEndIso(value: string): string {
  return addDaysIso(weekStartIso(new Date(value)), 4)
}

export function monthStartIso(value: string): string {
  const [year, month] = value.split('-').map(Number)
  return toIsoDate(new Date(year, month - 1, 1))
}

export function nextMonthStartIso(value: string): string {
  const [year, month] = value.split('-').map(Number)
  return toIsoDate(new Date(year, month, 1))
}
