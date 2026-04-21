import { describe, it, expect, vi } from 'vitest'

vi.mock('@/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ calls: [] }),
  },
}))

describe('CallHistoryPane', () => {
  it('exports a default component', async () => {
    const mod = await import('./CallHistoryPane')
    expect(mod.default).toBeTruthy()
    expect(typeof mod.default).toBe('function')
  })
})
