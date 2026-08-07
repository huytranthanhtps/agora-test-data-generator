import type { Rng } from './rng'
import type { TextLen } from './types'
import { faker } from './faker-seed'

export function loremByLen(_rng: Rng, len: TextLen): string {
  if (len === 'normal') return faker.lorem.sentence()
  if (len === 'long') return faker.lorem.paragraph()
  return faker.lorem.paragraphs(6, '\n\n')
}

export function htmlMessage(rng: Rng, len: TextLen): string {
  const items = Array.from({ length: rng.int(2, 4) }, () => `<li>${faker.lorem.sentence()}</li>`).join('')
  const body = loremByLen(rng, len)
  return [
    `<h2>${faker.lorem.words(rng.int(3, 6))}</h2>`,
    `<p>${body}</p>`,
    `<p><strong>${faker.lorem.words(3)}</strong>: ${faker.lorem.sentence()}</p>`,
    `<ul>${items}</ul>`,
  ].join('\n')
}

export function chatTranscript(_rng: Rng, a: string, b: string, messages: number): string {
  const lines: string[] = []
  for (let i = 0; i < messages; i++) {
    const who = i % 2 === 0 ? a : b
    lines.push(`<div class="msg"><b>${who}:</b> ${faker.lorem.sentence()}</div>`)
  }
  return `<div class="chat">\n${lines.join('\n')}\n</div>`
}
