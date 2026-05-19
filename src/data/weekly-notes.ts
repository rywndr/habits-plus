export type WeeklyNote = {
  id: string
  /** ISO date YYYY-MM-DD */
  date: string
  dateLabel: string
  p1: string
  p2: string
  p3: string
}

export const weeklyNotes: Array<WeeklyNote> = [
  {
    id: 'w-1',
    date: '2026-01-30',
    dateLabel: '30 Januari 2026',
    p1: 'Instruksi disampaikan bertahap dengan jeda waktu.',
    p2: 'Siswa terlihat lebih siap mengikuti kegiatan tanpa interupsi.',
    p3: 'Memberi waktu tunggu yang lebih konsisten sebelum membantu.',
  },
  {
    id: 'w-2',
    date: '2026-01-23',
    dateLabel: '23 Januari 2026',
    p1: 'Penggunaan jadwal visual di awal pembelajaran.',
    p2: 'Transisi antar kegiatan berjalan lebih tenang.',
    p3: 'Jadwal perlu ditampilkan lebih dekat dengan area duduk siswa.',
  },
  {
    id: 'w-3',
    date: '2026-01-16',
    dateLabel: '16 Januari 2026',
    p1: 'Pengelompokan siswa secara tetap dalam satu minggu.',
    p2: 'Interaksi antar siswa terasa lebih stabil.',
    p3: 'Komposisi kelompok perlu dievaluasi untuk minggu...',
  },
  {
    id: 'w-4',
    date: '2026-01-09',
    dateLabel: '9 Januari 2026',
    p1: 'Instruksi lisan disertai contoh langsung.',
    p2: 'Siswa lebih cepat memahami tugas yang diberikan.',
    p3: 'Contoh perlu dibuat lebih singkat agar tidak menghabiskan waktu.',
  },
  {
    id: 'w-5',
    date: '2026-01-02',
    dateLabel: '2 Januari 2026',
    p1: 'Pengaturan tempat duduk yang konsisten.',
    p2: 'Distraksi selama kegiatan individu berkurang.',
    p3: 'Posisi duduk beberapa siswa masih perlu penyesuaian.',
  },
  {
    id: 'w-6',
    date: '2025-12-19',
    dateLabel: '19 Desember 2025',
    p1: 'Pembagian aktivitas menjadi langkah-langkah kecil.',
    p2: 'Siswa lebih mudah menyelesaikan tugas sampai...',
    p3: 'Petunjuk langkah perlu ditampilkan lebih jelas.',
  },
  {
    id: 'w-7',
    date: '2025-12-12',
    dateLabel: '12 Desember 2025',
    p1: 'Penggunaan isyarat visual saat memberi instruksi.',
    p2: 'Respons siswa terhadap instruksi menjadi lebih konsisten.',
    p3: 'Isyarat visual perlu disederhanakan.',
  },
  {
    id: 'w-8',
    date: '2025-12-05',
    dateLabel: '5 Desember 2025',
    p1: 'Rutinitas pembukaan kelas yang sama setiap hari.',
    p2: 'Siswa terlihat lebih siap saat pembelajaran dimulai.',
    p3: 'Durasi rutinitas perlu dipersingkat.',
  },
  {
    id: 'w-9',
    date: '2025-11-28',
    dateLabel: '28 November 2025',
    p1: 'Pemberian pengingat singkat sebelum pergantian aktivitas.',
    p2: 'Perubahan aktivitas berjalan lebih lancar.',
    p3: 'Pengingat perlu diberikan lebih awal pada beberapa siswa.',
  },
  {
    id: 'w-10',
    date: '2025-11-21',
    dateLabel: '21 November 2025',
    p1: 'Pendampingan verbal minimal selama aktivitas mandiri.',
    p2: 'Siswa lebih mandiri dalam menyelesaikan tugas.',
    p3: 'Perlu menentukan kapan bantuan perlu diberikan.',
  },
]
