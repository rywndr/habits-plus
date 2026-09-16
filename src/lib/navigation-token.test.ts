import { describe, expect, it, vi } from 'vitest'
import { settleLatestNavigation } from './navigation-token'

describe('settleLatestNavigation', () => {
  it('does not settle an older navigation while a newer one is active', () => {
    const settle = vi.fn()

    expect(settleLatestNavigation(1, 2, settle)).toBe(false)
    expect(settle).not.toHaveBeenCalled()
  })

  it('settles the active navigation', () => {
    const settle = vi.fn()

    expect(settleLatestNavigation(2, 2, settle)).toBe(true)
    expect(settle).toHaveBeenCalledOnce()
  })
})
