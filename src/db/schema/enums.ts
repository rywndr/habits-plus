import { pgEnum } from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role', ['admin', 'guru', 'ortu'])
export const genderEnum = pgEnum('gender', ['L', 'P'])
export const indicatorEnum = pgEnum('indicator', [
  'respons',
  'interaksi',
  'partisipasi',
  'regulasi',
])
export const frequencyEnum = pgEnum('frequency', [
  'tidak-terlihat',
  'terlihat-sesekali',
  'sering',
])

export type Role = (typeof roleEnum.enumValues)[number]
export type Gender = (typeof genderEnum.enumValues)[number]
export type Indicator = (typeof indicatorEnum.enumValues)[number]
export type Frequency = (typeof frequencyEnum.enumValues)[number]

export const frequencyScore: Record<Frequency, number> = {
  'tidak-terlihat': 0,
  'terlihat-sesekali': 1,
  sering: 2,
}

export const scoreFrequency = [
  'tidak-terlihat',
  'terlihat-sesekali',
  'sering',
] as const
