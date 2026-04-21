import { describe, it, expect } from 'vitest'

describe('ReportDialog', () => {
  it('module exports exist', async () => {
    const mod = await import('./ReportDialog')
    expect(mod).toBeTruthy()
    expect(Object.keys(mod).length).toBeGreaterThan(0)
  })
})
