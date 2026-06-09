import type { DepartmanDto } from '../types/permission.types'

/** GET /api/Departman — id null kayıtlar dahil, benzersiz adi ile dropdown seçenekleri */
export function buildDepartmanAdiOptions(
  departmans: DepartmanDto[],
): { value: string; label: string }[] {
  const seen = new Set<string>()
  const options: { value: string; label: string }[] = []

  for (const departman of departmans) {
    if (!departman.aktif) continue

    const adi = departman.adi.trim()
    if (!adi) continue

    const key = adi.toLocaleLowerCase('tr-TR')
    if (seen.has(key)) continue

    seen.add(key)
    options.push({ value: adi, label: adi })
  }

  return options.sort((a, b) => a.label.localeCompare(b.label, 'tr-TR'))
}
