import { frequencyScore } from '#/db/schema'
import { addUsage, createChatCompletion, emptyUsage } from './deepseek'
import type { DeepseekUsage } from './deepseek'
import type { Frequency, Indicator } from '#/db/schema'

export type StudentWeekDay = {
  date: string
  scores: Partial<Record<Indicator, Frequency>>
  note: string | null
}

export type StudentWeekData = {
  studentId: string
  gender: 'L' | 'P'
  days: Array<StudentWeekDay>
}

export type WeekContext = {
  weekStart: string
  weekEnd: string
  weeklyNote: { p1: string; p2: string; p3: string } | null
  studentNames: Array<string>
}

export type GeneratedDraft = {
  studentId: string
  content?: string
  error?: string
  usage: DeepseekUsage
}

const INDICATOR_CODES: Array<[Indicator, string]> = [
  ['respons', 'R'],
  ['interaksi', 'I'],
  ['partisipasi', 'P'],
  ['regulasi', 'G'],
]

const dayFormatter = new Intl.DateTimeFormat('id-ID', { weekday: 'short' })

/**
 * Remove student names from free-text notes so no identity ever reaches the
 * API. Matches whole words of each name part (3+ chars) case-insensitively.
 */
export function scrubNames(text: string, names: Array<string>): string {
  let result = text
  const parts = new Set(
    names
      .flatMap((name) => name.split(/\s+/))
      .filter((part) => part.length >= 3),
  )
  for (const part of parts) {
    const escaped = part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), 'siswa')
  }
  return result
}

/**
 * Compact, anonymized encoding of one student's week. No name, no NISN, no
 * ids, just gender, per-day indicator scores, and scrubbed notes.
 */
function encodeStudentWeek(
  student: StudentWeekData,
  context: WeekContext,
): string {
  const lines: Array<string> = []
  lines.push(
    `Profil: anak ${student.gender === 'L' ? 'laki-laki' : 'perempuan'}`,
  )
  lines.push(`Periode: ${context.weekStart} s/d ${context.weekEnd}`)
  lines.push(
    'Data harian (R=respons, I=interaksi, P=partisipasi, G=regulasi diri; 0=tidak terlihat, 1=terlihat sesekali, 2=sering):',
  )

  for (const day of student.days) {
    const codes = INDICATOR_CODES.map(([indicator, code]) => {
      const frequency = day.scores[indicator]
      return frequency === undefined
        ? `${code}-`
        : `${code}${frequencyScore[frequency]}`
    }).join(' ')
    const dayLabel = dayFormatter.format(new Date(day.date))
    const note = day.note?.trim()
      ? ` | catatan guru: ${scrubNames(day.note.trim(), context.studentNames)}`
      : ''
    lines.push(`${dayLabel} ${day.date}: ${codes}${note}`)
  }

  if (context.weeklyNote) {
    lines.push('Refleksi guru untuk kelas minggu ini:')
    if (context.weeklyNote.p1.trim())
      lines.push(
        `- Pendekatan: ${scrubNames(context.weeklyNote.p1, context.studentNames)}`,
      )
    if (context.weeklyNote.p2.trim())
      lines.push(
        `- Yang membantu: ${scrubNames(context.weeklyNote.p2, context.studentNames)}`,
      )
    if (context.weeklyNote.p3.trim())
      lines.push(
        `- Perlu disesuaikan: ${scrubNames(context.weeklyNote.p3, context.studentNames)}`,
      )
  }

  return lines.join('\n')
}

const SYSTEM_PROMPT = `Kamu adalah guru pendamping di sekolah inklusi yang menulis laporan mingguan untuk orang tua dari anak autis. Kamu menerima data observasi satu minggu untuk satu anak (tanpa nama, demi privasi).

Tulis ringkasan dalam Bahasa Indonesia yang hangat, personal, dan mudah dipahami orang tua. Sebut anak sebagai "Ananda" — jangan pernah memakai nama atau placeholder lain.

Aturan:
- 2-3 paragraf pendek, total maksimal 180 kata.
- Paragraf 1: cerita perkembangan Ananda minggu ini secara umum, sebutkan momen atau pola positif yang spesifik dari data.
- Paragraf 2: hal yang masih dilatih, dibingkai positif sebagai proses berkembang (bukan kekurangan).
- Paragraf akhir: satu saran lembut yang bisa dilakukan orang tua di rumah, selaras dengan pendekatan guru.
- Jangan menyebut angka, skor, kode indikator, atau istilah teknis/medis.
- Jangan mendiagnosis, menjanjikan kesembuhan, atau membandingkan dengan anak lain.
- Nada: empatik, menghargai usaha kecil, menumbuhkan harapan yang realistis.

Balas hanya dengan teks ringkasan, tanpa judul atau pembuka surat.`

async function generateOne(
  student: StudentWeekData,
  context: WeekContext,
): Promise<GeneratedDraft> {
  try {
    const { content, usage } = await createChatCompletion([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: encodeStudentWeek(student, context) },
    ])
    return { studentId: student.studentId, content, usage }
  } catch (error) {
    return {
      studentId: student.studentId,
      error: error instanceof Error ? error.message : 'Gagal menghubungi API.',
      usage: emptyUsage(),
    }
  }
}

const MAX_CONCURRENT_REQUESTS = 4

export async function generateWeeklySummaries(
  studentsData: Array<StudentWeekData>,
  context: WeekContext,
): Promise<{ drafts: Array<GeneratedDraft>; usage: DeepseekUsage }> {
  const drafts: Array<GeneratedDraft> = []
  for (let i = 0; i < studentsData.length; i += MAX_CONCURRENT_REQUESTS) {
    const chunk = studentsData.slice(i, i + MAX_CONCURRENT_REQUESTS)
    drafts.push(
      ...(await Promise.all(chunk.map((item) => generateOne(item, context)))),
    )
  }

  const usage = drafts.reduce(
    (acc, draft) => addUsage(acc, draft.usage),
    emptyUsage(),
  )
  return { drafts, usage }
}
