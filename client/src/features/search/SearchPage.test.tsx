import { describe, it, expect, vi } from 'vitest'

vi.mock('@/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue({ hits: [], counts: {} }),
  },
}))

vi.mock('@/components/Toast', () => ({
  showToast: vi.fn(),
}))

describe('SearchPage', () => {
  it('exports a default component', async () => {
    const mod = await import('./SearchPage')
    expect(mod.default).toBeTruthy()
    expect(typeof mod.default).toBe('function')
  })

  it('renders the five filter chips + All', async () => {
    const { render } = await import('@testing-library/preact')
    const mod = await import('./SearchPage')
    const { getByText } = render(<mod.default />)
    expect(getByText('All')).toBeTruthy()
    expect(getByText('Posts')).toBeTruthy()
    expect(getByText('People')).toBeTruthy()
    expect(getByText('Spaces')).toBeTruthy()
    expect(getByText('Pages')).toBeTruthy()
    expect(getByText('DMs')).toBeTruthy()
  })
})
