// Chinese characters for a student's optional Chinese name, and playful
// nicknames for the preferred name.
export const CHINESE_CHARS = ['伟', '明', '嘉', '慧', '志', '豪', '欣', '怡', '俊', '杰', '丽', '颖', '永', '盛', '美', '玲'] as const
export const NICKNAMES = ['Ah Boy', 'Ah Girl', 'Junior', 'Bubbles', 'Sunny', 'Lucky', 'Tiger', 'Angel'] as const

export const GRADES = ['Nursery', 'K1', 'K2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'Secondary 1'] as const

// A guardian is a non-parent relative or trusted contact for the children.
// Relationships are grouped by gender so an emitted guardian stays consistent
// (a "Grandfather" is never female); "Family Friend" fits either gender.
export const GUARDIAN_RELATIONSHIPS = {
  male: ['Grandfather', 'Uncle', 'Family Friend'],
  female: ['Grandmother', 'Aunt', 'Family Friend'],
} as const
export const SUBJECTS = ['Mathematics', 'English', 'Science', 'Chinese', 'Malay', 'Tamil', 'Physics', 'Chemistry', 'Biology', 'Coding'] as const
export const LEVELS = ['Foundation', 'Standard', 'Advanced', 'Olympiad'] as const
export const SUBJECT_TYPE = ['Academic', 'Enrichment', 'Language', 'STEM'] as const
export const INSTANCE_STATUS = ['Draft', 'Open', 'Full', 'Ongoing', 'Completed', 'Cancelled'] as const
export const RATE_TYPE = ['Per Session', 'Per Term', 'Per Month', 'Package'] as const
export const BUSINESS_UNITS = ['Tampines Hub', 'Jurong East', 'Orchard Central', 'Bishan Point', 'Woodlands Civic'] as const
export const VENUES = ['Room A1', 'Room B2', 'Studio 3', 'Hall 1', 'Lab 2', 'Online (Zoom)'] as const
export const PROGRAMMES = ['MOE-aligned', 'IB', 'Cambridge', 'Holiday Camp', 'Weekend Intensive'] as const
export const PRODUCT_STATUS = ['Active', 'Inactive', 'Draft', 'Archived'] as const
export const PRODUCT_TYPE = ['Course Package', 'Material', 'Assessment', 'Membership'] as const
export const VARIANT_TYPE = ['Single', 'Bundle', 'Subscription'] as const
export const TIME_PERIOD = ['Term 1', 'Term 2', 'Term 3', 'Term 4', 'Full Year'] as const
export const SEND_TO = ['All Parents', 'All Students', 'Class Members', 'Specific Group', 'Staff Only'] as const
export const PRODUCT_BASES = ['Workbook', 'Assessment Kit', 'Learning Bundle', 'Practice Pack', 'Membership Pass'] as const
export const COURSE_FOCUS = ['Problem Solving', 'Exam Prep', 'Foundations', 'Concept Mastery', 'Critical Thinking', 'Creative Writing', 'Lab Skills', 'Olympiad Training', 'Speech & Drama', 'Revision Intensive'] as const
export const PRODUCT_EDITIONS = ['2026 Edition', 'Revised Edition', 'Deluxe Set', 'Starter Pack', 'Complete Bundle', 'Digital Access', 'Practice Companion'] as const

export const DEV_MARKER = '[DEV]'
export const EMAIL_DOMAIN = 'yopmail.com'

// School-date (venue calendar) types and per-type name pools. See
// sql/722_create_school_date.sql — an entry is an event, a term/half-term break,
// or a closure, shown on the parent-app calendar for a venue.
export const SCHOOL_DATE_TYPE = ['Event', 'Break', 'Closure'] as const
export const SCHOOL_EVENT_NAMES = ['Sports Day', 'Open House', 'Parent-Teacher Conference', 'Graduation Ceremony', 'Annual Concert', 'Science Fair', 'Book Fair', 'Founders Day', 'Excursion Day', 'Report Card Day'] as const
export const SCHOOL_BREAK_NAMES = ['Term 1 Break', 'Term 2 Break', 'Term 3 Break', 'Half-Term Break', 'March Holidays', 'June Holidays', 'September Holidays', 'Year-End Break'] as const
export const SCHOOL_CLOSURE_NAMES = ['Public Holiday — Deepavali', 'Public Holiday — Hari Raya Puasa', 'Public Holiday — Chinese New Year', 'Public Holiday — National Day', 'Staff Training Day', 'Deep Cleaning Closure', 'Emergency Closure', 'Renovation Closure'] as const
