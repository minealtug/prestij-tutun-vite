import { isAppError, normalizeApiError } from '@/lib/api/api-error'

function collectErrorHaystack(error: unknown): { status: number; text: string; message: string } {
  const normalized = isAppError(error) ? error : normalizeApiError(error)
  const parts = [normalized.message]

  if (normalized.fieldErrors) {
    for (const messages of Object.values(normalized.fieldErrors)) {
      parts.push(...messages)
    }
  }

  return {
    status: normalized.status,
    text: parts.join(' ').toLocaleLowerCase('tr-TR'),
    message: normalized.message,
  }
}

function isTechnicalBackendMessage(message: string): boolean {
  const trimmed = message.trim()
  if (!trimmed) return true
  if (/id\s*=\s*\d+/i.test(trimmed)) return true
  if (/^[a-z0-9_.=:\s-]+$/i.test(trimmed) && /secenek|bulunamad|icin\b/i.test(trimmed)) {
    return true
  }
  return false
}

export function getFriendlyOptionGroupErrorMessage(error: unknown): string {
  const { status, text, message } = collectErrorHaystack(error)

  if (
    /(cevap|yanit|yanıt|answer|response|kullaniliyor|kullanılıyor|referenc|foreign|constraint)/i.test(
      text,
    )
  ) {
    return 'Bu seçenek anket cevaplarında kullanıldığı için silinemez. Kullanıldığı sorulardaki yanıtlar durduğu sürece listeden kaldırılamaz.'
  }

  if (/alt\s*se[cç]enek/i.test(text) && /bulunamad/i.test(text)) {
    return 'Seçenek silinemedi. Bu seçenek anketlerde kullanılıyor olabilir veya listeden daha önce kaldırılmış olabilir. Sayfayı yenileyip tekrar deneyin.'
  }

  if (/se[cç]enek/i.test(text) && /bulunamad/i.test(text)) {
    return 'Seçenek bulunamadı. Sayfayı yeniledikten sonra tekrar deneyin.'
  }

  if (/(duplicate|zaten|already|mevcut)/i.test(text) && /(se[cç]enek|option|grup)/i.test(text)) {
    return 'Bu seçenek grubu zaten tanımlı. Farklı seçenekler girin.'
  }

  if (status === 403) return 'Bu işlem için yetkiniz yok.'
  if (status === 409) {
    return 'Bu seçenek mevcut kayıtlarda kullanıldığı için değiştirilemez veya silinemez.'
  }

  if (isTechnicalBackendMessage(message) || status === 404) {
    return 'Seçenek grubu kaydedilemedi. Silmek istediğiniz seçenek anketlerde kullanılıyor olabilir. Sayfayı yenileyip tekrar deneyin.'
  }

  return message
}
