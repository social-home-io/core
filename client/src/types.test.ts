import { describe, it, expect } from 'vitest'

describe('types', () => {
  it('exports type definitions (compile-time check)', async () => {
    const mod = await import('./types')
    // Types are compile-time only — just verify the module loads
    expect(mod).toBeTruthy()
  })
})
