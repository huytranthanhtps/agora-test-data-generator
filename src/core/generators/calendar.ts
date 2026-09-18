import type { Generator } from '../types'
import { htmlMessage, iconicName } from '../text'
import { BASE_DATE, addDays, fmtDate, fmtTime } from './shared'
import { CALENDAR_TYPE, BUSINESS_UNITS, PROGRAMMES } from '../data'

// Empty-time placeholder for all-day rows (mirrors NULL start_time/end_time).
const NONE = '—'

export const calendarGenerator: Generator = {
  key: 'calendar',
  label: 'Calendar',
  shortcut: 8,
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'description', label: 'Description', html: true },
    { key: 'venue', label: 'Venue' },
    { key: 'programme', label: 'Programme' },
    { key: 'startDate', label: 'Start date' },
    { key: 'endDate', label: 'End date' },
    { key: 'allDay', label: 'All day' },
    { key: 'startTime', label: 'Start time' },
    { key: 'endTime', label: 'End time' },
  ],
  generate({ count, len }, { rng, uniq }) {
    return Array.from({ length: count }, () => {
      const type = rng.pick(CALENDAR_TYPE)
      const name = uniq.ensure('calendar.name', () => iconicName(rng, len))

      const venue = rng.pick(BUSINESS_UNITS)
      // programme_id NULL (whole venue) ~60%, narrowed to one programme ~40%.
      const programme = rng.bool(0.4) ? rng.pick(PROGRAMMES) : 'Whole venue'
      const description = htmlMessage(rng, len)

      const start = addDays(BASE_DATE, rng.int(1, 120))
      // Only Events are ever timed; breaks/closures are always all-day.
      const timed = type === 'Event' && rng.bool(0.5)

      if (timed) {
        // Timed single-day: end_date == start_date and end_time > start_time
        // (SQL school_date_single_day_time_order).
        const startHour = rng.int(8, 15) // 08:00–15:00, on the hour
        const endHour = startHour + rng.int(1, 4) // +1..4h, still same day (<= 19:00)
        return {
          name,
          type,
          description,
          venue,
          programme,
          startDate: fmtDate(start),
          endDate: fmtDate(start),
          allDay: 'No',
          startTime: fmtTime(startHour, 0),
          endTime: fmtTime(endHour, 0),
        }
      }

      // All-day: single day for Events, a multi-day range for Break/Closure.
      const span = type === 'Event' ? 0 : rng.int(0, 13)
      const end = addDays(start, span)
      return {
        name,
        type,
        description,
        venue,
        programme,
        startDate: fmtDate(start),
        endDate: fmtDate(end),
        allDay: 'Yes',
        startTime: NONE,
        endTime: NONE,
      }
    })
  },
}
