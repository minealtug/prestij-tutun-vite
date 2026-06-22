export const AGE_GROUP_LABELS = [
  '0–4',
  '5–9',
  '10–14',
  '15–19',
  '20–24',
  '25–29',
  '30–34',
  '35–39',
  '40–44',
  '45–49',
  '50–54',
  '55–59',
  '60–64',
  '65+',
] as const

export const AGE_GROUP_RANGES: { label: string; minAge: number; maxAge: number | null }[] = [
  { label: '0–4', minAge: 0, maxAge: 4 },
  { label: '5–9', minAge: 5, maxAge: 9 },
  { label: '10–14', minAge: 10, maxAge: 14 },
  { label: '15–19', minAge: 15, maxAge: 19 },
  { label: '20–24', minAge: 20, maxAge: 24 },
  { label: '25–29', minAge: 25, maxAge: 29 },
  { label: '30–34', minAge: 30, maxAge: 34 },
  { label: '35–39', minAge: 35, maxAge: 39 },
  { label: '40–44', minAge: 40, maxAge: 44 },
  { label: '45–49', minAge: 45, maxAge: 49 },
  { label: '50–54', minAge: 50, maxAge: 54 },
  { label: '55–59', minAge: 55, maxAge: 59 },
  { label: '60–64', minAge: 60, maxAge: 64 },
  { label: '65+', minAge: 65, maxAge: null },
]

export const GROWER_AGE_BUCKETS = [
  '18–29',
  '30–39',
  '40–49',
  '50–59',
  '60–69',
  '70+',
] as const

export function computeAge(birthDate: string | null | undefined, referenceDate = new Date()): number | null {
  if (!birthDate?.trim()) return null
  const birth = new Date(birthDate)
  if (Number.isNaN(birth.getTime())) return null

  let age = referenceDate.getFullYear() - birth.getFullYear()
  const monthDiff = referenceDate.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birth.getDate())) {
    age -= 1
  }
  return age >= 0 && age <= 120 ? age : null
}

export function getAgeGroupLabel(age: number | null): string | null {
  if (age == null || age < 0) return null
  for (const range of AGE_GROUP_RANGES) {
    if (range.maxAge == null && age >= range.minAge) return range.label
    if (range.maxAge != null && age >= range.minAge && age <= range.maxAge) return range.label
  }
  return null
}

export function getGrowerAgeBucket(age: number | null): string | null {
  if (age == null || age < 18) return null
  if (age < 30) return '18–29'
  if (age < 40) return '30–39'
  if (age < 50) return '40–49'
  if (age < 60) return '50–59'
  if (age < 70) return '60–69'
  return '70+'
}

export function deriveGenderFromTc(tcKimlikNo: string | null | undefined): 'erkek' | 'kadin' | 'bilinmiyor' {
  const digits = tcKimlikNo?.replace(/\D/g, '') ?? ''
  if (digits.length !== 11) return 'bilinmiyor'
  const genderDigit = Number(digits[9])
  if (!Number.isFinite(genderDigit)) return 'bilinmiyor'
  return genderDigit % 2 === 1 ? 'erkek' : 'kadin'
}

export function parseGenderFromText(text: string | null | undefined): 'erkek' | 'kadin' | 'bilinmiyor' {
  const normalized = text?.trim().toLocaleLowerCase('tr-TR') ?? ''
  if (!normalized) return 'bilinmiyor'
  if (/erkek|bay|oğlan|oglan|male/.test(normalized)) return 'erkek'
  if (/kad[ıi]n|bayan|k[ıi]z|kiz|female/.test(normalized)) return 'kadin'
  return 'bilinmiyor'
}

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

export function seededRandom(seed: number, index: number): number {
  const x = Math.sin(seed + index * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function generateSyntheticChildren(
  ekiciId: string,
  childCount: number,
  bolgeAdi: string | null,
): { gender: 'erkek' | 'kadin'; birthDate: string; age: number }[] {
  const seed = hashString(`${ekiciId}-${bolgeAdi ?? 'genel'}`)
  const children: { gender: 'erkek' | 'kadin'; birthDate: string; age: number }[] = []
  const now = new Date()

  for (let i = 0; i < childCount; i += 1) {
    const ageRoll = seededRandom(seed, i)
    const age = Math.floor(ageRoll * 18)
    const genderRoll = seededRandom(seed, i + 100)
    const gender: 'erkek' | 'kadin' = genderRoll > 0.48 ? 'erkek' : 'kadin'
    const birthYear = now.getFullYear() - age
    const month = Math.floor(seededRandom(seed, i + 200) * 12)
    const day = Math.floor(seededRandom(seed, i + 300) * 28) + 1
    const birthDate = new Date(birthYear, month, day).toISOString()
    children.push({ gender, birthDate, age })
  }

  return children
}

export function estimateChildCountFromSeed(ekiciId: string): number {
  const seed = hashString(ekiciId)
  const roll = seededRandom(seed, 1)
  if (roll < 0.18) return 0
  if (roll < 0.42) return 1
  if (roll < 0.68) return 2
  if (roll < 0.86) return 3
  return 4
}
