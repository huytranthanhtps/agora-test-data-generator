import type { Generator } from '../types'
import type { Rng } from '../rng'
import { faker } from '../faker-seed'
import { htmlMessage } from '../text'
import { BASE_DATE, addDays, fmtDate, fmtTime } from './shared'
import {
  SCHOOL_DATE_TYPE,
  SCHOOL_EVENT_NAMES,
  SCHOOL_BREAK_NAMES,
  SCHOOL_CLOSURE_NAMES,
  BUSINESS_UNITS,
  PROGRAMMES,
} from '../data'

// Empty-time placeholder for all-day rows (mirrors NULL start_time/end_time).
const NONE = '—'

// Name pool per date type.
const NAMES_BY_TYPE: Record<(typeof SCHOOL_DATE_TYPE)[number], readonly string[]> = {
  Event: SCHOOL_EVENT_NAMES,
  Break: SCHOOL_BREAK_NAMES,
  Closure: SCHOOL_CLOSURE_NAMES,
}

// Where the event physically happens: a specific place inside (or outside) the
// `venue` campus. Drawn from the seeded faker so it stays reproducible, in four
// shapes — street address, landmark, room name, external civic venue.
const LANDMARK_SUFFIX = ['Centre', 'Hall', 'Auditorium', 'Pavilion'] as const
const ROOM_WORD = ['Room', 'Studio', 'Lab', 'Hall'] as const
const CIVIC_SUFFIX = ['Community Club', 'Sports Complex', 'Public Library', 'Convention Centre'] as const
const ROOM_LETTER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as const

function eventLocation(r: Rng): string {
  switch (r.int(0, 3)) {
    case 0:
      return faker.location.streetAddress()
    case 1:
      return `${faker.company.name()} ${r.pick(LANDMARK_SUFFIX)}`
    case 2:
      return `${r.pick(ROOM_WORD)} ${r.pick(ROOM_LETTER)}${r.int(1, 4)}`
    default:
      return `${faker.location.city()} ${r.pick(CIVIC_SUFFIX)}`
  }
}

export const schoolDateGenerator: Generator = {
  key: 'schoolDate',
  label: 'School Date',
  shortcut: 8,
  fields: [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'description', label: 'Description', html: true },
    { key: 'venue', label: 'Venue' },
    { key: 'location', label: 'Location' },
    { key: 'programme', label: 'Programme' },
    { key: 'startDate', label: 'Start date' },
    { key: 'endDate', label: 'End date' },
    { key: 'allDay', label: 'All day' },
    { key: 'startTime', label: 'Start time' },
    { key: 'endTime', label: 'End time' },
  ],
  generate({ count, len }, { rng, uniq }) {
    return Array.from({ length: count }, () => {
      const type = rng.pick(SCHOOL_DATE_TYPE)
      const name = uniq.ensure('schoolDate.name', () => rng.pick(NAMES_BY_TYPE[type]))

      const venue = rng.pick(BUSINESS_UNITS)
      // programme_id NULL (whole venue) ~60%, narrowed to one programme ~40%.
      const programme = rng.bool(0.4) ? rng.pick(PROGRAMMES) : 'Whole venue'
      const location = eventLocation(rng)
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
          location,
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
        location,
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
