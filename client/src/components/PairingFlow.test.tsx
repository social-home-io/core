import { describe, it, expect, vi } from 'vitest'

// Mock i18n
vi.mock('@/i18n/i18n', () => ({
  t: (key: string) => key,
  locale: { value: 'en' },
  setLocale: vi.fn(),
}))

describe('PairingFlow', () => {
  it('module exports exist', async () => {
    const mod = await import('./PairingFlow')
    expect(mod).toBeTruthy()
    expect(typeof mod.openPairing).toBe('function')
    expect(typeof mod.PairingFlow).toBe('function')
  })

  it('openPairing accepts mode parameter', async () => {
    const { openPairing } = await import('./PairingFlow')
    expect(() => openPairing('household')).not.toThrow()
    expect(() => openPairing('gfs')).not.toThrow()
  })
})
