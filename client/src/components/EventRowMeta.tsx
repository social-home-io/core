/**
 * EventRowMeta — the trailing "when" cluster of an agenda event row,
 * shared by the household calendar
 * (``features/calendar/CalendarPage.tsx``) and the per-space calendar
 * tab (``features/spaces/SpaceFeedPage.tsx``).
 *
 * Both surfaces render the same per-day card (``.sh-calendar-day-group``
 * holding ``.sh-event`` rows) off the same ``groupEventsByDay`` buckets,
 * so the row's time / span labelling lives here once — two hand-kept
 * copies is exactly how the household and a space drift apart.
 *
 * A multi-day event lands on every day it covers, so a row has to say
 * WHERE in the span it sits: :func:`formatDayPortion` supplies the
 * label ("1 – 3 May · from 16:00"), the badge ("Starts" / "Day 2 of 3"
 * / "Ends") and a screen-reader summary. Two deliberate omissions:
 *
 * * A single-day **all-day** event has an EMPTY label — its "All day"
 *   badge already says everything a ``00:00`` clock would pretend to,
 *   and an empty ``<time>`` element would just leave a gap in the flex
 *   row.
 * * The "All day" badge itself only renders for a single-day event. On
 *   a span the label reads "all day" on every day already, so the badge
 *   would be pure repetition.
 *
 * Presentational only — no signals, no fetches. ``children`` render
 * last so a surface can append its own trailing affordance (the
 * household page passes its location pin through the slot).
 */
import type { ComponentChildren, VNode } from 'preact'
import { t } from '@/i18n/i18n'
import { formatDayPortion, type DayEventEntry } from '@/utils/calendar'

export function EventRowMeta(
  { entry, children }: { entry: DayEventEntry; children?: ComponentChildren },
): VNode {
  const { when, badge, aria } = formatDayPortion(entry)
  return (
    <span class="sh-event-meta">
      {when && <time dateTime={entry.event.start}>{when}</time>}
      {badge && <span class="sh-event-span-badge">{badge}</span>}
      {entry.event.all_day && entry.dayCount === 1 && (
        <span class="sh-badge">{t('calendar.all_day')}</span>
      )}
      {aria && <span class="sr-only">{aria}</span>}
      {children}
    </span>
  )
}
