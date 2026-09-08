import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/preact'

import type { CalendarEvent } from '@/types'
import { groupEventsByDay, type DayEventEntry } from '@/utils/calendar'
import { EventRowMeta } from './EventRowMeta'

// No i18n mock — the real ``t()`` resolves against en.json, so the
// assertions read as the strings a user actually sees ("All day",
// "Day 2 of 3"). If a key drifts, this test surfaces it.

function evt(over: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: 'e1',
    calendar_id: 'cal-1',
    summary: 'Thing',
    description: null,
    // Naked LOCAL wall-clock strings (no ``Z``) for every timed
    // fixture: timed rows bucket in the VIEWER's zone, so a UTC
    // instant lands on a different local day at UTC+13/+14 and the
    // hard-coded expectations below would drift with ``TZ``. The
    // all-day fixtures deliberately keep ``Z`` instants + an explicit
    // ``tz`` — those are read in the event's own zone and are
    // zone-independent by construction. Same rule as
    // ``utils/calendar.test.ts``.
    start: '2026-05-01T16:00:00',
    end: '2026-05-01T17:00:00',
    all_day: false,
    created_by: 'u1',
    attendees: ['u1'],
    rrule: null,
    capacity: null,
    rsvp_enabled: false,
    location: null,
    cover_url: null,
    tz: 'UTC',
    ...over,
  }
}

/** Entries built by the REAL grouping helper — hand-rolled
 *  ``DayEventEntry`` literals would let the component drift away from
 *  the shapes it is actually handed. */
function entriesFor(e: CalendarEvent): Record<string, DayEventEntry[]> {
  return groupEventsByDay([e])
}

describe('EventRowMeta', () => {
  it('renders a plain time and no span badge for an ordinary timed event', () => {
    const grouped = entriesFor(evt({}))
    const keys = Object.keys(grouped)
    expect(keys.length).toBe(1)
    const entry = grouped[keys[0]][0]
    const { container } = render(<EventRowMeta entry={entry} />)
    const time = container.querySelector('time')
    expect(time).toBeTruthy()
    expect(time!.getAttribute('datetime')).toBe(entry.event.start)
    expect(time!.textContent).toBeTruthy()
    expect(container.querySelector('.sh-event-span-badge')).toBeNull()
    expect(container.querySelector('.sr-only')).toBeNull()
    expect(container.querySelector('.sh-event-meta')).toBeTruthy()
  })

  it('renders the span badge and a screen-reader summary on a middle day', () => {
    const grouped = entriesFor(evt({
      start: '2026-05-01T16:00:00',
      end: '2026-05-03T10:00:00',
    }))
    // Select by span position, not by a literal key — the key set is
    // asserted first so a drift is a failure, never a silent pass.
    const keys = Object.keys(grouped).sort()
    expect(keys).toEqual(['2026-05-01', '2026-05-02', '2026-05-03'])
    const middle = grouped[keys[1]][0]
    expect(middle.dayIndex).toBe(2)
    expect(middle.dayCount).toBe(3)
    const { container } = render(<EventRowMeta entry={middle} />)
    expect(container.querySelector('.sh-event-span-badge')?.textContent)
      .toBe('Day 2 of 3')
    const sr = container.querySelector('.sr-only')
    expect(sr).toBeTruthy()
    expect(sr!.textContent).toContain('day 2 of 3')
    expect(container.querySelector('time')).toBeTruthy()
  })

  it('renders the All day badge and no time for a single-day all-day event', () => {
    const grouped = entriesFor(evt({
      all_day: true,
      start: '2026-05-01T00:00:00Z',
      end: '2026-05-01T23:59:00Z',
    }))
    const keys = Object.keys(grouped)
    expect(keys).toEqual(['2026-05-01'])
    const entry = grouped[keys[0]][0]
    expect(entry.dayCount).toBe(1)
    const { container } = render(<EventRowMeta entry={entry} />)
    expect(container.querySelector('time')).toBeNull()
    expect(container.querySelector('.sh-badge')?.textContent).toBe('All day')
  })

  it('drops the All day badge on a multi-day all-day span', () => {
    const grouped = entriesFor(evt({
      all_day: true,
      start: '2026-05-01T00:00:00Z',
      end: '2026-05-03T23:59:00Z',
    }))
    const keys = Object.keys(grouped).sort()
    expect(keys).toEqual(['2026-05-01', '2026-05-02', '2026-05-03'])
    const entry = grouped[keys[1]][0]
    expect(entry.dayCount).toBe(3)
    const { container } = render(<EventRowMeta entry={entry} />)
    expect(container.querySelector('.sh-badge')).toBeNull()
    expect(container.querySelector('.sh-event-span-badge')).toBeTruthy()
  })

  it('renders children last in the meta cluster', () => {
    const grouped = entriesFor(evt({}))
    const entry = grouped[Object.keys(grouped)[0]][0]
    const { container } = render(
      <EventRowMeta entry={entry}>
        <span class="sh-event-row-locpin">📍</span>
      </EventRowMeta>,
    )
    const meta = container.querySelector('.sh-event-meta')!
    expect(meta.querySelector('.sh-event-row-locpin')).toBeTruthy()
    expect(meta.lastElementChild?.className).toBe('sh-event-row-locpin')
  })
})
