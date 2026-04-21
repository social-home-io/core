import { describe, it, expect } from 'vitest'

describe('VideoPlayer', () => {
  it('module exports exist', async () => {
    const mod = await import('./VideoPlayer')
    expect(mod).toBeTruthy()
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
