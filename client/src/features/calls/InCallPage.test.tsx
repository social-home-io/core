import { describe, it, expect, vi } from 'vitest'

vi.mock('@/api', () => ({
  api: {
    get:   vi.fn().mockResolvedValue({ ice_servers: [] }),
    post:  vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('@/components/Toast', () => ({
  showToast: vi.fn(),
}))

describe('InCallPage', () => {
  it('exports a default component', async () => {
    const mod = await import('./InCallPage')
    expect(mod.default).toBeTruthy()
    expect(typeof mod.default).toBe('function')
  })
})
