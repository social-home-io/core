import { describe, it, expect } from 'vitest'

describe('FollowingFeed', () => {
  it('module exports exist', async () => {
    const mod = await import('./FollowingFeed')
    expect(mod).toBeTruthy()
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
