import { describe, it, expect } from 'vitest'

describe('MultiSelect', () => {
  it('module exports exist', async () => {
    const mod = await import('./MultiSelect')
    expect(mod).toBeTruthy()
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
