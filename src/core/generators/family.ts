import type { Rng } from '../rng'
import type { Uniqueness } from '../uniqueness'
import type { TextLen } from '../types'
import { makePerson, makeEmail, sgMobile, chineseName, preferredName } from '../names'
import { dobForAge } from './shared'
import { loremByLen } from '../text'
import { faker } from '../faker-seed'
import { GRADES, GUARDIAN_RELATIONSHIPS } from '../data'

// A parent's household: 1–3 children (who share the parent's surname) and
// 0–2 guardians (non-parent relatives / trusted contacts). Both are rendered
// as nested HTML blocks inside the parent record — the merged Child data lives
// here rather than in a standalone generator.

export interface Child {
  firstName: string
  lastName: string
  preferredName: string
  chineseName: string
  gender: 'male' | 'female'
  dob: string
  age: string
  gradeLevel: string
  allergies: string
  email: string
}

export interface Guardian {
  firstName: string
  lastName: string
  fullName: string
  gender: 'male' | 'female'
  relationship: string
  mobile: string
  email: string
}

/** Children inherit the parent's surname, keeping the family link explicit. */
export function makeChildren(
  rng: Rng,
  uniq: Uniqueness,
  parentLast: string,
  len: TextLen,
): Child[] {
  const n = rng.int(1, 3)
  return Array.from({ length: n }, () => {
    const p = makePerson(rng)
    const { dob, age } = dobForAge(rng, 4, 16)
    // A Chinese name only fits some children — here, Chinese-Malaysians.
    const cn = p.country === 'malaysia' && rng.bool(0.5) ? chineseName(rng) : ''
    const nick = preferredName(rng)
    const grade = rng.pick(GRADES)
    const allergies = len === 'normal' ? faker.lorem.words(2) : loremByLen(rng, len)
    const email = makeEmail(
      { first: p.first, last: parentLast, full: `${p.first} ${parentLast}`, gender: p.gender, country: p.country },
      uniq,
    )
    return {
      firstName: p.first,
      lastName: parentLast,
      preferredName: nick,
      chineseName: cn,
      gender: p.gender,
      dob,
      age: String(age),
      gradeLevel: grade,
      allergies,
      email,
    }
  })
}

/** Guardians are unrelated in surname; the relationship stays gender-consistent. */
export function makeGuardians(rng: Rng, uniq: Uniqueness): Guardian[] {
  const n = rng.int(0, 2)
  return Array.from({ length: n }, () => {
    const p = makePerson(rng)
    return {
      firstName: p.first,
      lastName: p.last,
      fullName: p.full,
      gender: p.gender,
      relationship: rng.pick(GUARDIAN_RELATIONSHIPS[p.gender]),
      mobile: sgMobile(rng),
      email: makeEmail(p, uniq),
    }
  })
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** One roster entry: a bold name, a middot-joined facts line, and a meta line. */
function personLi(name: string, facts: string, meta: string): string {
  return `<li><strong>${esc(name)}</strong> — ${esc(facts)}<br><span class="meta">${esc(meta)}</span></li>`
}

/** The shared card wrapper for both children and guardians. */
function familyBlock(heading: string, count: number, body: string): string {
  return `<div class="family"><h3>${heading} (${count})</h3>${body}</div>`
}

function childItem(c: Child): string {
  const name = c.chineseName ? `${c.firstName} ${c.lastName} (${c.chineseName})` : `${c.firstName} ${c.lastName}`
  const facts = [cap(c.gender), `DOB ${c.dob}`, `age ${c.age}`, c.gradeLevel, `“${c.preferredName}”`].join(' · ')
  return personLi(name, facts, `${c.email} · allergies: ${c.allergies}`)
}

export function childrenHtml(children: Child[]): string {
  const items = children.map(childItem).join('')
  return familyBlock('🧒 Children', children.length, `<ul>${items}</ul>`)
}

function guardianItem(g: Guardian): string {
  const facts = [g.relationship, cap(g.gender), g.mobile].join(' · ')
  return personLi(g.fullName, facts, g.email)
}

export function guardiansHtml(guardians: Guardian[]): string {
  const body =
    guardians.length === 0
      ? '<p><em>No additional guardians.</em></p>'
      : `<ul>${guardians.map(guardianItem).join('')}</ul>`
  return familyBlock('🧑‍🤝‍🧑 Guardians', guardians.length, body)
}
