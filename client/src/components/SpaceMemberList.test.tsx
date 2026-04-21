import { describe, it, expect } from 'vitest'

describe('SpaceMemberList', () => {
  it('module exports exist', async () => {
    const mod = await import('./SpaceMemberList')
    expect(mod).toBeTruthy()
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
