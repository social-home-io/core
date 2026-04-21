import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/preact'
import { SpaceCard } from './SpaceCard'
import type { DirectoryEntry } from '@/types'

const baseEntry: DirectoryEntry = {
  space_id: 's1', host_instance_id: 'h1',
  host_display_name: 'Nabu Casa', host_is_paired: true,
  name: 'Chess Club', description: 'Weekly chess', emoji: '♟',
  member_count: 7, scope: 'global', join_mode: 'request',
  min_age: 0, target_audience: 'all',
}

describe('SpaceCard', () => {
  it('renders the global scope chip', () => {
    const { getByText } = render(
      <SpaceCard entry={baseEntry} onAction={() => {}} />,
    )
    expect(getByText(/Global/).textContent).toContain('Global')
  })

  it('renders a "Connect first" CTA when host is unpaired', () => {
    const { getByText } = render(
      <SpaceCard
        entry={{ ...baseEntry, host_is_paired: false }}
        onAction={() => {}}
      />,
    )
    expect(getByText(/Connect with/i)).toBeTruthy()
  })

  it('renders "Request pending" disabled when pending', () => {
    const { getByText } = render(
      <SpaceCard
        entry={{ ...baseEntry, request_pending: true }}
        onAction={() => {}}
      />,
    )
    const btn = getByText('Request pending') as HTMLButtonElement
    expect(btn).toBeTruthy()
    expect(btn.closest('button')?.disabled).toBe(true)
  })

  it('renders "Open space" when already a member', () => {
    const { getByText } = render(
      <SpaceCard
        entry={{ ...baseEntry, already_member: true, scope: 'household' }}
        onAction={() => {}}
      />,
    )
    expect(getByText('Open space')).toBeTruthy()
  })

  it('shows age chip when min_age > 0', () => {
    const { getByText } = render(
      <SpaceCard
        entry={{ ...baseEntry, min_age: 13 }}
        onAction={() => {}}
      />,
    )
    expect(getByText('13+')).toBeTruthy()
  })
})
