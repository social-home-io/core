import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/preact'

describe('HaUsersPanel', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('renders HA users with synced toggles', async () => {
    vi.doMock('@/api', () => ({
      api: {
        get: vi.fn(async () => ([
          {
            username: 'alice', display_name: 'Alice',
            picture_url: null, is_admin: false, synced: true,
          },
          {
            username: 'kid', display_name: 'Kid',
            picture_url: null, is_admin: false, synced: false,
          },
        ])),
        post: vi.fn(),
        delete: vi.fn(),
      },
    }))
    const { HaUsersPanel } = await import('./HaUsersPanel')
    const { findByText } = render(<HaUsersPanel />)
    expect(await findByText('Alice')).toBeTruthy()
    expect(await findByText('Kid')).toBeTruthy()
    expect(await findByText('Synced')).toBeTruthy()
    expect(await findByText('Not synced')).toBeTruthy()
  })

  it('flips the toggle and calls POST /provision for a new sync', async () => {
    const post = vi.fn(async () => ({ synced: true }))
    vi.doMock('@/api', () => ({
      api: {
        get: vi.fn(async () => ([{
          username: 'kid', display_name: 'Kid',
          picture_url: null, is_admin: false, synced: false,
        }])),
        post,
        delete: vi.fn(),
      },
    }))
    const { HaUsersPanel } = await import('./HaUsersPanel')
    const { findByLabelText } = render(<HaUsersPanel />)
    const toggle = (await findByLabelText('Sync Kid')) as HTMLInputElement
    toggle.click()
    await new Promise((r) => setTimeout(r, 20))
    expect(post).toHaveBeenCalledWith('/api/admin/ha-users/kid/provision')
  })
})
