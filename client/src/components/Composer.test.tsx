import { describe, it, expect } from 'vitest'

describe('Composer', () => {
  it('module exports exist', async () => {
    const mod = await import('./Composer')
    expect(mod).toBeTruthy()
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
