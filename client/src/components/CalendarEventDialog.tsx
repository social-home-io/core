/**
 * CalendarEventDialog — event creation + detail (§23.60).
 */
import { signal } from '@preact/signals'
import { api } from '@/api'
import { Modal } from './Modal'
import { Button } from './Button'
import { showToast } from './Toast'

const open = signal(false)
const calendarId = signal('')
const summary = signal('')
const startDate = signal('')
const startTime = signal('')
const endDate = signal('')
const endTime = signal('')
const allDay = signal(false)
const description = signal('')
const submitting = signal(false)

export function openEventDialog(calId: string) {
  calendarId.value = calId
  summary.value = ''; description.value = ''
  const now = new Date()
  startDate.value = now.toISOString().slice(0, 10)
  startTime.value = now.toTimeString().slice(0, 5)
  const end = new Date(now.getTime() + 3600000)
  endDate.value = end.toISOString().slice(0, 10)
  endTime.value = end.toTimeString().slice(0, 5)
  allDay.value = false
  open.value = true
}

export function CalendarEventDialog({ onCreated }: { onCreated?: () => void }) {
  const submit = async () => {
    if (!summary.value.trim() || submitting.value) return
    submitting.value = true
    try {
      const start = allDay.value ? `${startDate.value}T00:00:00Z` : `${startDate.value}T${startTime.value}:00Z`
      const end = allDay.value ? `${endDate.value}T23:59:59Z` : `${endDate.value}T${endTime.value}:00Z`
      await api.post(`/api/calendars/${calendarId.value}/events`, {
        summary: summary.value, start, end, all_day: allDay.value,
        description: description.value || undefined,
      })
      showToast('Event created', 'success')
      open.value = false
      onCreated?.()
    } catch (e: any) { showToast(e.message || 'Failed', 'error') }
    finally { submitting.value = false }
  }

  return (
    <Modal open={open.value} onClose={() => open.value = false} title="New Event">
      <div class="sh-form">
        <label>Summary * <input value={summary.value} onInput={(e) => summary.value = (e.target as HTMLInputElement).value} /></label>
        <label><input type="checkbox" checked={allDay.value} onChange={() => allDay.value = !allDay.value} /> All day</label>
        <label>Start date <input type="date" value={startDate.value} onInput={(e) => startDate.value = (e.target as HTMLInputElement).value} /></label>
        {!allDay.value && <label>Start time <input type="time" value={startTime.value} onInput={(e) => startTime.value = (e.target as HTMLInputElement).value} /></label>}
        <label>End date <input type="date" value={endDate.value} onInput={(e) => endDate.value = (e.target as HTMLInputElement).value} /></label>
        {!allDay.value && <label>End time <input type="time" value={endTime.value} onInput={(e) => endTime.value = (e.target as HTMLInputElement).value} /></label>}
        <label>Description <textarea value={description.value} onInput={(e) => description.value = (e.target as HTMLTextAreaElement).value} rows={2} /></label>
        <Button onClick={submit} loading={submitting.value} disabled={!summary.value.trim()}>Create event</Button>
      </div>
    </Modal>
  )
}
