import { describe, it, expect } from 'vitest'

describe('KeyboardShortcuts', () => {
  it('module exports exist', async () => {
    const mod = await import('./KeyboardShortcuts')
    expect(mod).toBeTruthy()
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
