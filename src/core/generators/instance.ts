import type { Generator } from '../types'
import { futureDate, addDays, fmtDate } from './shared'
import { INSTANCE_STATUS, RATE_TYPE } from '../data'

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

export const instanceGenerator: Generator = {
  key: 'instance',
  label: 'Course Instance',
  shortcut: 3,
  fields: [
    { key: 'courseCode', label: 'Course code' },
    { key: 'startDate', label: 'Start date' },
    { key: 'endDate', label: 'End date' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'duration', label: 'Duration (min)' },
    { key: 'price', label: 'Price (SGD)' },
    { key: 'seats', label: 'Seats' },
    { key: 'status', label: 'Status' },
    { key: 'rateType', label: 'Rate type' },
  ],
  generate({ count }, { rng, uniq }) {
    return Array.from({ length: count }, () => {
      const courseCode = uniq.ensure('instance.code', () =>
        Array.from({ length: 8 }, () => LETTERS[rng.int(0, 25)]).join(''))
      const sessions = rng.int(4, 12)
      const start = futureDate(rng, 3, 30)
      const end = addDays(start, sessions * 7)
      return {
        courseCode,
        startDate: fmtDate(start),
        endDate: fmtDate(end),
        sessions: String(sessions),
        duration: String(rng.pick([60, 90, 120] as const)),
        price: String(rng.int(120, 800)),
        seats: String(rng.int(8, 30)),
        status: rng.pick(INSTANCE_STATUS),
        rateType: rng.pick(RATE_TYPE),
      }
    })
  },
}
