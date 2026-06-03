export function uniqueById<T extends { id: number; adi: string }>(items: T[]): T[] {
  const map = new Map<number, T>()
  for (const item of items) {
    map.set(item.id, item)
  }
  return [...map.values()].sort((a, b) => a.adi.localeCompare(b.adi, 'tr-TR'))
}
