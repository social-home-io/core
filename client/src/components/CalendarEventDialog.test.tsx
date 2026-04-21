import { describe, it, expect } from 'vitest'

describe('CalendarEventDialog', () => {
  it('module exports exist', async () => {
    const mod = await import('./CalendarEventDialog')
    expect(mod).toBeTruthy()
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
