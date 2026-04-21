import { describe, it, expect } from 'vitest'

describe('OnboardingFlow', () => {
  it('module exports exist', async () => {
    const mod = await import('./OnboardingFlow')
    expect(mod).toBeTruthy()
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
