import { describe, it, expect } from 'vitest'

describe('SkeletonScreen', () => {
  it('module exports exist', async () => {
    const mod = await import('./SkeletonScreen')
    expect(mod).toBeTruthy()
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
