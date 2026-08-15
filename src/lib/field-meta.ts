// Field-type taxonomy: maps a field key to a data category so the UI can
// colour-code it. The category encodes what KIND of data the field holds —
// this is information, not decoration.

export type FieldCategory =
  | 'identity'
  | 'contact'
  | 'temporal'
  | 'numeric'
  | 'enum'
  | 'rich'
  | 'text'

const RULES: [FieldCategory, RegExp][] = [
  ['rich', /^(message|conversation|children|guardians)$/],
  ['contact', /email|mobile|phone/],
  ['temporal', /date|dob|start|end|period/],
  ['numeric', /age|price|min|max|session|duration|seat|count|messages|qty/],
  [
    'identity',
    /name|avatar|participant|teacher|first|last|full|preferred|chinese|nick/,
  ],
  [
    'enum',
    /status|type|relationship|gender|currency|require|deposit|rate|subject|grade|programme|venue|business|send|variant|level|unit|slug|sku|code/,
  ],
]

export function fieldCategory(key: string): FieldCategory {
  const k = key.toLowerCase()
  for (const [cat, re] of RULES) if (re.test(k)) return cat
  return 'text'
}

export function categoryColorVar(cat: FieldCategory): string {
  return `var(--cat-${cat})`
}

/** Up to two initials from a name-ish value, for avatar chips. */
export function initialsFrom(value: string): string {
  const words = value.replace(/\[.*?\]/g, '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '??'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/** Stable hue (0–359) derived from a string, for deterministic avatar colours. */
export function hueFromString(value: string): number {
  let h = 0
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) % 360
  return h
}
