import { describe, expect, it } from 'vitest'
import { resolveSelectedClassId } from './class-selection'

const classes = [{ id: 'class-a' }, { id: 'class-b' }]

describe('resolveSelectedClassId', () => {
  it('keeps a class ID from the available classes', () => {
    expect(resolveSelectedClassId(classes, 'class-b')).toBe('class-b')
  })

  it.each([undefined, '', 'all', 'unknown'])(
    'returns no selection for %s',
    (requestedClassId) => {
      expect(resolveSelectedClassId(classes, requestedClassId)).toBe('')
    },
  )
})
