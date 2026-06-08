import type { DepartmanAdi, UserDto } from '../types/user.types'

export function uniqueDepartmanAdlari(adlar: string[]): DepartmanAdi[] {
  const seen = new Set<string>()
  const result: DepartmanAdi[] = []

  for (const raw of adlar) {
    const adi = raw.trim()
    if (!adi) continue

    const key = adi.toLocaleLowerCase('tr-TR')
    if (seen.has(key)) continue
    seen.add(key)
    result.push(adi)
  }

  return result.sort((a, b) => a.localeCompare(b, 'tr-TR'))
}

export function extractDepartmanAdlariFromUsers(users: UserDto[]): DepartmanAdi[] {
  return uniqueDepartmanAdlari(
    users.map((user) => user.departmanAdi ?? '').filter(Boolean),
  )
}

export function departmanAdlariToSelectOptions(adlar: DepartmanAdi[]) {
  return adlar.map((adi) => ({ value: adi, label: adi, key: adi }))
}
