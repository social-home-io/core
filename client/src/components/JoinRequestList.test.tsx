import { describe, it, expect } from 'vitest'

describe('JoinRequestList', () => {
  it('module exports exist', async () => {
    const mod = await import('./JoinRequestList')
    expect(mod).toBeTruthy()
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
