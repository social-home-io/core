import { describe, it, expect, vi } from 'vitest'

// Mock the API module before importing the page. Per-test mocks
// override the default no-op shape via ``vi.mocked(api.get).mockImplementation``.
vi.mock('@/api', () => ({
  api: {
    get: vi.fn().mockResolvedValue([]),
    post: vi.fn().mockResolvedValue({}),
    patch: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue(undefined),
  },
}))

// Mock auth store
vi.mock('@/store/auth', () => ({
  currentUser: { value: { user_id: 'u1', username: 'admin', display_name: 'Admin', is_admin: true, picture_url: null, bio: null, is_new_member: false } },
  token: { value: 'test-tok' },
  isAuthed: { value: true },
  setToken: vi.fn(),
  logout: vi.fn(),
}))

// Title hook + household users + WS are out-of-scope for these tests.
vi.mock('@/store/pageTitle', () => ({ useTitle: vi.fn() }))
vi.mock('@/store/householdUsers', () => ({
  householdUsers: { value: new Map() },
  loadHouseholdUsers: vi.fn().mockResolvedValue(undefined),
}))

describe('CalendarPage', () => {
  it('module exports a default component', async () => {
    const mod = await import('./CalendarPage')
    expect(mod.default).toBeTruthy()
    expect(typeof mod.default).toBe('function')
  })

  it('renders day-group headings in chronological order regardless of creation order', async () => {
    // Regression for the bug where three events scheduled for
    // 2026-05-14, 2026-05-19 and 2026-05-21 surfaced as 14 → 21 →
    // 19 in the agenda. The root cause was a locale-fragile
    // ``new Date(toLocaleDateString())`` round-trip in the day-key
    // sort; this test pins the rendered order at the SPA boundary.
    const { api } = await import('@/api')
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === '/api/calendars') {
        return [{
          id: 'cal-1',
          name: 'Family',
          owner_username: 'admin',
          color: null,
        }]
      }
      if (url.startsWith('/api/calendars/cal-1/events')) {
        // Order intentionally NOT chronological to mimic the
        // multi-calendar ``responses.flat()`` shape in the bug
        // report. The page must surface them in event-date order
        // anyway.
        return [
          {
            id: 'e14', calendar_id: 'cal-1', summary: 'On the 14th',
            description: null,
            start: '2026-05-14T10:00:00Z', end: '2026-05-14T11:00:00Z',
            all_day: false, rrule: null, capacity: null,
            created_by: 'u1', attendees: ['u1'],
            rsvp_enabled: false, location: null, cover_url: null,
          },
          {
            id: 'e21', calendar_id: 'cal-1', summary: 'On the 21st',
            description: null,
            start: '2026-05-21T10:00:00Z', end: '2026-05-21T11:00:00Z',
            all_day: false, rrule: null, capacity: null,
            created_by: 'u1', attendees: ['u1'],
            rsvp_enabled: false, location: null, cover_url: null,
          },
          {
            id: 'e19', calendar_id: 'cal-1', summary: 'On the 19th',
            description: null,
            start: '2026-05-19T10:00:00Z', end: '2026-05-19T11:00:00Z',
            all_day: false, rrule: null, capacity: null,
            created_by: 'u1', attendees: ['u1'],
            rsvp_enabled: false, location: null, cover_url: null,
          },
        ]
      }
      return []
    })

    const { render, waitFor } = await import('@testing-library/preact')
    const mod = await import('./CalendarPage')
    const { container } = render(<mod.default />)

    // Wait for the async load to settle and all three day headings
    // to be rendered.
    await waitFor(() => {
      const titles = container.querySelectorAll('.sh-event strong')
      expect(titles.length).toBe(3)
    }, { timeout: 2000 })

    const eventTitles = Array.from(
      container.querySelectorAll('.sh-event strong'),
    ).map(el => el.textContent)
    expect(eventTitles).toEqual([
      'On the 14th', 'On the 19th', 'On the 21st',
    ])
  })

  it('spreads a multi-day event across one day card per day, expanding only the clicked row', async () => {
    // Regression for the bug where a Fri–Sun event was filed only
    // under Friday (invisible when you looked at Saturday). Dates are
    // built relative to ``new Date()`` because the page fetches — and
    // now CLAMPS the day expansion to — the month range around today;
    // hard-coded 2026 dates would only survive because the mock
    // ignores the query string.
    const now = new Date()
    const iso = (day: number, hour: number) =>
      new Date(now.getFullYear(), now.getMonth(), day, hour, 0, 0).toISOString()

    const { api } = await import('@/api')
    vi.mocked(api.get).mockImplementation(async (url: string) => {
      if (url === '/api/calendars') {
        return [{
          id: 'cal-1',
          name: 'Family',
          owner_username: 'admin',
          color: null,
        }]
      }
      if (url.startsWith('/api/calendars/cal-1/events')) {
        return [{
          id: 'trip', calendar_id: 'cal-1', summary: 'Weekend trip',
          description: null,
          start: iso(5, 16), end: iso(7, 10),
          all_day: false, rrule: null, capacity: null,
          created_by: 'u1', attendees: ['u1'],
          rsvp_enabled: false, location: null, cover_url: null,
        }]
      }
      return []
    })

    const { render, waitFor, fireEvent } = await import('@testing-library/preact')
    const mod = await import('./CalendarPage')
    const { container } = render(<mod.default />)

    await waitFor(() => {
      expect(container.querySelectorAll('.sh-event strong').length).toBe(3)
    }, { timeout: 2000 })
    expect(container.querySelectorAll('.sh-calendar-day-group').length).toBe(3)

    // Clicking the middle day's row expands exactly that row — the
    // expansion is keyed by ``dayKey:eventId``, not by event id, so the
    // same event on the other two day cards stays collapsed.
    const rows = container.querySelectorAll('.sh-event')
    fireEvent.click(rows[1])
    await waitFor(() => {
      expect(container.querySelectorAll('.sh-event-detail').length).toBe(1)
    }, { timeout: 2000 })
    expect(rows[1].querySelector('.sh-event-detail')).toBeTruthy()
  })
})
