export type Gender = 'L' | 'P'

export type Student = {
  id: string
  nisn: string
  name: string
  classId: string
  gender: Gender
  parentId?: string
}

export const students: Array<Student> = [
  { id: 's-1', nisn: '20268481', name: 'Leonardo Bagus', classId: 'c-2', gender: 'L' },
  { id: 's-2', nisn: '20268482', name: 'Dina Anggraini', classId: 'c-2', gender: 'P' },
  { id: 's-3', nisn: '20268483', name: 'Nurhidayatul Rahma', classId: 'c-2', gender: 'P' },
  { id: 's-4', nisn: '20268484', name: 'Rahman Hakim', classId: 'c-2', gender: 'L', parentId: 'u-ortu-1' },
  { id: 's-5', nisn: '20268485', name: 'Steven', classId: 'c-2', gender: 'L' },
  { id: 's-6', nisn: '20268486', name: 'Ria Amalia Zahra', classId: 'c-2', gender: 'P' },
  { id: 's-7', nisn: '20268487', name: 'Doni Saputra', classId: 'c-2', gender: 'L' },
  { id: 's-8', nisn: '20268488', name: 'Drensen Wu', classId: 'c-2', gender: 'L' },
  { id: 's-9', nisn: '20268489', name: 'Bastin Johanson', classId: 'c-2', gender: 'L' },
  { id: 's-10', nisn: '20268490', name: 'Yono Frederik', classId: 'c-2', gender: 'L' },
]
