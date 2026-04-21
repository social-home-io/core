import { describe, it, expect } from 'vitest'

describe('NotificationBell', () => {
  it('module exports exist', async () => {
    const mod = await import('./NotificationBell')
    expect(mod).toBeTruthy()
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
