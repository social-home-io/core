import { describe, it, expect } from 'vitest'

describe('LongPressMenu', () => {
  it('module exports exist', async () => {
    const mod = await import('./LongPressMenu')
    expect(mod).toBeTruthy()
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
