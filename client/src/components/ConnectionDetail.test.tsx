import { describe, it, expect } from 'vitest'

describe('ConnectionDetail', () => {
  it('module exports exist', async () => {
    const mod = await import('./ConnectionDetail')
    expect(mod).toBeTruthy()
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
