import { describe, it, expect, vi } from 'vitest'
import { toasts, showToast } from './Toast'

describe('Toast', () => {
  it('showToast adds a toast to the list', () => {
    const before = toasts.value.length
    showToast('Test message', 'info')
    expect(toasts.value.length).toBe(before + 1)
    expect(toasts.value[toasts.value.length - 1].message).toBe('Test message')
  })

  it('showToast auto-removes after timeout', async () => {
    vi.useFakeTimers()
    const before = toasts.value.length
    showToast('Temp', 'success')
    expect(toasts.value.length).toBe(before + 1)
    vi.advanceTimersByTime(5000)
    expect(toasts.value.length).toBe(before)
    vi.useRealTimers()
  })
})
