import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/preact'

describe('ModerationQueue', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('fetches /api/spaces/{id}/moderation and lists pending items', async () => {
    vi.doMock('@/api', () => ({
      api: {
        get: vi.fn(async () => ([{
          id: 'item-1', space_id: 'sp-1',
          feature: 'posts', action: 'create',
          submitted_by: 'uid-bob', status: 'pending',
          payload: { content: 'hi' },
          submitted_at: '2026-04-18T00:00:00Z',
          expires_at:   '2026-04-25T00:00:00Z',
        }])),
        post: vi.fn(),
      },
    }))
    const { ModerationQueue } = await import('./ModerationQueue')
    const { findByText } = render(<ModerationQueue spaceId="sp-1" />)
    expect(await findByText('Approve')).toBeTruthy()
    expect(await findByText(/By: uid-bob/)).toBeTruthy()
  })

  it('renders the empty state when the queue returns []', async () => {
    vi.doMock('@/api', () => ({
      api: {
        get: vi.fn(async () => ([])),
        post: vi.fn(),
      },
    }))
    const { ModerationQueue } = await import('./ModerationQueue')
    const { findByText } = render(<ModerationQueue spaceId="sp-1" />)
    expect(await findByText('No content pending review.')).toBeTruthy()
  })

  it('shows an alert region when the fetch fails', async () => {
    vi.doMock('@/api', () => ({
      api: {
        get: vi.fn(async () => {
          throw new Error('boom')
        }),
        post: vi.fn(),
      },
    }))
    const { ModerationQueue } = await import('./ModerationQueue')
    const { findByRole } = render(<ModerationQueue spaceId="sp-1" />)
    const alert = await findByRole('alert')
    expect(alert.textContent).toContain('boom')
  })
})
