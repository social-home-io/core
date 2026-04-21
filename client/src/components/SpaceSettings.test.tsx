import { describe, it, expect, vi } from 'vitest'

// Mock i18n
vi.mock('@/i18n/i18n', () => ({
  t: (key: string) => key,
  locale: { value: 'en' },
  setLocale: vi.fn(),
}))

describe('SpaceSettings', () => {
  it('module exports exist', async () => {
    const mod = await import('./SpaceSettings')
    expect(mod).toBeTruthy()
    expect(typeof mod.SpaceSettings).toBe('function')
  })
})
