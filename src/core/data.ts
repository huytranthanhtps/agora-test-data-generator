export type Ethnicity = 'chinese' | 'malay' | 'indian' | 'eurasian'

export const ETHNICITY_WEIGHTS: readonly [Ethnicity, number][] = [
  ['chinese', 74], ['malay', 13], ['indian', 9], ['eurasian', 4],
]

export const CHINESE_SURNAMES = ['Tan', 'Lim', 'Lee', 'Ng', 'Ong', 'Wong', 'Goh', 'Chua', 'Chan', 'Koh', 'Teo', 'Ang', 'Yeo', 'Low', 'Sim'] as const
export const CHINESE_GIVEN = ['Wei Ming', 'Jia Hui', 'Zhi Hao', 'Xin Yi', 'Jun Jie', 'Li Ying', 'Yong Sheng', 'Mei Ling', 'Kai Xin', 'Wen Qi'] as const
export const CHINESE_CHARS = ['伟', '明', '嘉', '慧', '志', '豪', '欣', '怡', '俊', '杰', '丽', '颖', '永', '盛', '美', '玲'] as const

export const MALAY_NAMES = ['Muhammad', 'Nur', 'Siti', 'Ahmad', 'Aisyah', 'Farhan', 'Aiman', 'Nabilah', 'Iskandar', 'Zulaikha'] as const
export const INDIAN_NAMES = ['Kumar', 'Priya', 'Ravi', 'Anand', 'Deepa', 'Suresh', 'Lakshmi', 'Vijay', 'Meena', 'Arjun'] as const
export const EURASIAN_SURNAMES = ['Pereira', 'De Souza', 'Rozario', 'Fernandez', 'Clarke', 'Scully', 'Theseira'] as const
export const WESTERN_GIVEN = ['Ryan', 'Chloe', 'Ethan', 'Sophia', 'Marcus', 'Isabelle', 'Daniel', 'Grace'] as const
export const NICKNAMES = ['Ah Boy', 'Ah Girl', 'Junior', 'Bubbles', 'Sunny', 'Lucky', 'Tiger', 'Angel'] as const

export const GRADES = ['Nursery', 'K1', 'K2', 'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6', 'Secondary 1'] as const
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

export const DEV_MARKER = '[DEV]'
export const EMAIL_DOMAIN = 'mailinator.com'
