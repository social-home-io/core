import { describe, it, expect } from 'vitest'

describe('DmComposerFull', () => {
  it('module exports exist', async () => {
    const mod = await import('./DmComposerFull')
    expect(mod).toBeTruthy()
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
