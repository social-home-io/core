import { describe, it, expect } from 'vitest'

describe('SpaceJoinLeave', () => {
  it('module exports exist', async () => {
    const mod = await import('./SpaceJoinLeave')
    expect(mod).toBeTruthy()
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
