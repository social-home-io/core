import { describe, it, expect, vi } from 'vitest'
import { haptic } from './HapticFeedback'

describe('haptic', () => {
  it('does not throw when navigator.vibrate is missing', () => {
    expect(() => haptic('light')).not.toThrow()
  })

  it('calls navigator.vibrate when available', () => {
    const vibrate = vi.fn()
    Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true })
    haptic('medium')
    expect(vibrate).toHaveBeenCalledWith(25)
    Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true })
  })
})
