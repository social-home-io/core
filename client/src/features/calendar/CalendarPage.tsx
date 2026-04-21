import { useEffect } from 'preact/hooks'
import { signal } from '@preact/signals'
import { api } from '@/api'
import type { CalendarEvent } from '@/types'
import { Spinner } from '@/components/Spinner'
import { Button } from '@/components/Button'
import { CalendarEventDialog, openEventDialog } from '@/components/CalendarEventDialog'
import { showToast } from '@/components/Toast'
import { events, rsvpCounts } from '@/store/calendar'

type ViewMode = 'month' | 'week' | 'day'

const loading = signal(true)
const viewMode = signal<ViewMode>('month')
const calendarId = signal<string>('')
const currentDate = signal(new Date())
const selectedEvent = signal<CalendarEvent | null>(null)
const rsvpPending = signal<string | null>(null)

function getDateRange(date: Date, mode: ViewMode): { start: string; end: string } {
  const d = new Date(date)
  if (mode === 'month') {
    const start = new Date(d.getFullYear(), d.getMonth(), 1)
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0)
    return { start: start.toISOString(), end: end.toISOString() }
  }
  if (mode === 'week') {
    const dayOfWeek = d.getDay()
    const start = new Date(d)
    start.setDate(d.getDate() - dayOfWeek)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return { start: start.toISOString(), end: end.toISOString() }
  }
  // day
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
  return { start: start.toISOString(), end: end.toISOString() }
}

async function loadEvents() {
  if (!calendarId.value) return
  loading.value = true
  const { start, end } = getDateRange(currentDate.value, viewMode.value)
  try {
    const rows = await api.get(
      `/api/calendars/${calendarId.value}/events`, { start, end },
    ) as CalendarEvent[]
    events.value = rows
  } catch {
    events.value = []
  }
  loading.value = false
}

function navigateDate(direction: number) {
  const d = new Date(currentDate.value)
  if (viewMode.value === 'month') d.setMonth(d.getMonth() + direction)
  else if (viewMode.value === 'week') d.setDate(d.getDate() + 7 * direction)
  else d.setDate(d.getDate() + direction)
  currentDate.value = d
}

function formatDateHeading(date: Date, mode: ViewMode): string {
  if (mode === 'month') return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  if (mode === 'week') {
    const start = new Date(date)
    start.setDate(date.getDate() - date.getDay())
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
  }
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

function groupEventsByDay(evts: CalendarEvent[]): Record<string, CalendarEvent[]> {
  const groups: Record<string, CalendarEvent[]> = {}
  for (const e of evts) {
    const key = new Date(e.start).toLocaleDateString()
    if (!groups[key]) groups[key] = []
    groups[key].push(e)
  }
  return groups
}

export default function CalendarPage() {
  useEffect(() => {
    api.get('/api/calendars').then(async (cals: { id: string }[]) => {
      if (cals.length > 0) {
        calendarId.value = cals[0].id
        await loadEvents()
      }
      loading.value = false
    })
  }, [])

  useEffect(() => {
    if (calendarId.value) loadEvents()
  }, [viewMode.value, currentDate.value])

  const handleRsvp = async (eventId: string, status: 'going' | 'maybe' | 'declined') => {
    const key = `${eventId}:${status}`
    rsvpPending.value = key
    try {
      await api.post(`/api/calendars/${calendarId.value}/events/${eventId}/rsvp`, { status })
      showToast(`RSVP: ${status}`, 'success')
    } catch {
      showToast('RSVP failed', 'error')
    } finally {
      if (rsvpPending.value === key) rsvpPending.value = null
    }
  }

  const handleDelete = async (eventId: string) => {
    if (!confirm('Delete this event?')) return
    try {
      await api.delete(`/api/calendars/events/${eventId}`)
      showToast('Event deleted', 'success')
      selectedEvent.value = null
      await loadEvents()
    } catch (err: unknown) {
      showToast(`Delete failed: ${(err as Error).message ?? err}`, 'error')
    }
  }

  const handleEdit = async (evt: CalendarEvent) => {
    const newSummary = prompt('Edit event title:', evt.summary)
    if (newSummary == null) return
    const trimmed = newSummary.trim()
    if (!trimmed) {
      showToast('Title cannot be empty', 'error')
      return
    }
    try {
      await api.patch(`/api/calendars/events/${evt.id}`, { summary: trimmed })
      showToast('Event updated', 'success')
      selectedEvent.value = null
      await loadEvents()
    } catch (err: unknown) {
      showToast(`Update failed: ${(err as Error).message ?? err}`, 'error')
    }
  }

  if (loading.value) return <Spinner />

  const grouped = groupEventsByDay(events.value)
  const dayKeys = Object.keys(grouped).sort((a, b) => new Date(a).getTime() - new Date(b).getTime())

  return (
    <div class="sh-calendar">
      <div class="sh-page-header">
        <h1>Calendar</h1>
        {calendarId.value && (
          <Button onClick={() => openEventDialog(calendarId.value)}>+ New event</Button>
        )}
      </div>

      <div class="sh-calendar-controls">
        <div class="sh-calendar-nav">
          <Button variant="secondary"
                  aria-label={`Previous ${viewMode.value}`}
                  onClick={() => navigateDate(-1)}>&#8249;</Button>
          <span class="sh-calendar-heading">{formatDateHeading(currentDate.value, viewMode.value)}</span>
          <Button variant="secondary"
                  aria-label={`Next ${viewMode.value}`}
                  onClick={() => navigateDate(1)}>&#8250;</Button>
          <Button variant="secondary" onClick={() => { currentDate.value = new Date() }}>Today</Button>
        </div>
        <div class="sh-calendar-views" role="tablist">
          {(['month', 'week', 'day'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              type="button"
              role="tab"
              aria-selected={viewMode.value === mode}
              class={viewMode.value === mode ? 'sh-tab sh-tab--active' : 'sh-tab'}
              onClick={() => { viewMode.value = mode }}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {events.value.length === 0 && (
        <div class="sh-empty-state">
          <div style={{ fontSize: '2rem' }}>📅</div>
          <h3>No events in this {viewMode.value}</h3>
          <p>Click <strong>+ New event</strong> to schedule something.</p>
        </div>
      )}

      {dayKeys.map(dayKey => (
        <div key={dayKey} class="sh-calendar-day-group">
          <h3 class="sh-calendar-day-heading">{dayKey}</h3>
          {grouped[dayKey].map(e => (
            <div key={e.id} class="sh-event" onClick={() => { selectedEvent.value = selectedEvent.value?.id === e.id ? null : e }}>
              <div class="sh-event-header">
                <strong>{e.summary}</strong>
                <time>{new Date(e.start).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</time>
                {e.all_day && <span class="sh-badge">All day</span>}
              </div>
              {selectedEvent.value?.id === e.id && (
                <div class="sh-event-detail">
                  {e.description && <p>{e.description}</p>}
                  <div class="sh-event-times">
                    <span>Start: {new Date(e.start).toLocaleString()}</span>
                    <span>End: {new Date(e.end).toLocaleString()}</span>
                  </div>
                  <div class="sh-event-rsvp">
                    <Button variant="primary"
                            loading={rsvpPending.value === `${e.id}:going`}
                            onClick={() => handleRsvp(e.id, 'going')}>
                      Going {rsvpCounts.value[e.id]?.going
                        ? `· ${rsvpCounts.value[e.id].going}` : ''}
                    </Button>
                    <Button variant="secondary"
                            loading={rsvpPending.value === `${e.id}:maybe`}
                            onClick={() => handleRsvp(e.id, 'maybe')}>
                      Maybe {rsvpCounts.value[e.id]?.maybe
                        ? `· ${rsvpCounts.value[e.id].maybe}` : ''}
                    </Button>
                    <Button variant="secondary"
                            loading={rsvpPending.value === `${e.id}:declined`}
                            onClick={() => handleRsvp(e.id, 'declined')}>
                      Declined {rsvpCounts.value[e.id]?.declined
                        ? `· ${rsvpCounts.value[e.id].declined}` : ''}
                    </Button>
                  </div>
                  <div class="sh-event-admin sh-row">
                    <Button variant="secondary" onClick={() => handleEdit(e)}>Edit</Button>
                    <Button variant="danger" onClick={() => handleDelete(e.id)}>Delete</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ))}

      <CalendarEventDialog onCreated={() => loadEvents()} />
    </div>
  )
}
