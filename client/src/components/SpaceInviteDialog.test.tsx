import { describe, it, expect } from 'vitest'

describe('SpaceInviteDialog', () => {
  it('module exports exist', async () => {
    const mod = await import('./SpaceInviteDialog')
    expect(mod).toBeTruthy()
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
