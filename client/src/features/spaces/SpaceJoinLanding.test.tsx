import { describe, it, expect, vi } from 'vitest'

vi.mock('@/api', () => ({
  api: {
    post: vi.fn().mockResolvedValue({ space_id: 'sp-1', role: 'member' }),
  },
}))

describe('SpaceJoinLanding', () => {
  it('exports a default component', async () => {
    const mod = await import('./SpaceJoinLanding')
    expect(mod.default).toBeTruthy()
    expect(typeof mod.default).toBe('function')
  })
})
