import { describe, it, expect } from 'vitest'

describe('SpaceCreateDialog', () => {
  it('module exports exist', async () => {
    const mod = await import('./SpaceCreateDialog')
    expect(mod).toBeTruthy()
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
