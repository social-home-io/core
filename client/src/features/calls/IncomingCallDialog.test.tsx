import { describe, it, expect, vi } from 'vitest'

vi.mock('@/api', () => ({
  api: {
    post: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('@/components/Toast', () => ({
  showToast: vi.fn(),
}))

describe('IncomingCallDialog', () => {
  it('exports a default component', async () => {
    const mod = await import('./IncomingCallDialog')
    expect(mod.default).toBeTruthy()
    expect(typeof mod.default).toBe('function')
  })

  it('renders nothing when no incoming call is set', async () => {
    const { render } = await import('@testing-library/preact')
    const { incoming } = await import('@/store/calls')
    incoming.value = null
    const mod = await import('./IncomingCallDialog')
    const { container } = render(<mod.default />)
    expect(container.textContent).toBe('')
  })

  it('renders the caller display + accept/decline when ringing', async () => {
    const { render } = await import('@testing-library/preact')
    const { incoming } = await import('@/store/calls')
    incoming.value = {
      call_id: 'c1', from_user: 'alice',
      call_type: 'video', signed_sdp: null,
    }
    const mod = await import('./IncomingCallDialog')
    const { getByText } = render(<mod.default />)
    expect(getByText(/alice is calling/)).toBeTruthy()
    expect(getByText('Accept')).toBeTruthy()
    expect(getByText('Decline')).toBeTruthy()
    incoming.value = null
  })
})
