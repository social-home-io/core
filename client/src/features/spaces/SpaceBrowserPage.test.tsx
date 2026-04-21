import { describe, it, expect, vi } from 'vitest'

vi.mock('@/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue([]),
    post: vi.fn().mockResolvedValue({}),
  },
}))
vi.mock('@/store/auth', () => ({
  currentUser: {
    value: {
      user_id: 'u1',
      username: 'a',
      display_name: 'A',
      is_admin: true,
      picture_url: null,
      picture_hash: null,
      bio: null,
      is_new_member: false,
    },
  },
  token: { value: 'tok' },
  isAuthed: { value: true },
}))

describe('SpaceBrowserPage', () => {
  it('module exports a default component', async () => {
    const mod = await import('./SpaceBrowserPage')
    expect(mod.default).toBeTruthy()
    expect(typeof mod.default).toBe('function')
  }, 20000)
})
