import { describe, it, expect, vi } from 'vitest'

vi.mock('@/api', () => ({ api: { get: vi.fn().mockResolvedValue([]), post: vi.fn().mockResolvedValue({}), patch: vi.fn().mockResolvedValue({}) } }))
vi.mock('@/store/auth', () => ({ currentUser: { value: { user_id: 'u1', username: 'admin', display_name: 'A', is_admin: true, is_minor: false, child_protection_enabled: false } } }))

describe('CpWsEvents', () => {
  it('module exports exist', async () => {
    const mod = await import('./CpWsEvents')
    expect(mod).toBeTruthy()
  })
})
