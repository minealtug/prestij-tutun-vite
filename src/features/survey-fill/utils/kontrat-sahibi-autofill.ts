import { parseGenderFromText } from '@/features/reports/utils/age-utils'
import type { AltSecenekOptionDto, SurveyFillSoruView } from '../types/anket-yanit.types'
import type { EkiciDto } from '../types/ekici.types'
import { getEkiciFullName } from './normalize-ekici-api'
import { getQuestionKey } from './question-key'

export function normalizeSurveyQuestionText(text: string) {
  return text
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/\s+/g, ' ')
    .replace(/[?？]/g, '')
}

function normalizeOptionText(text: string) {
  return text.trim().toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ')
}

export function isUretimiYapanQuestion(question: SurveyFillSoruView) {
  const normalized = normalizeSurveyQuestionText(question.soruMetni)
  return normalized.includes('üretimi yapan')
}

export function isKontratSahibiOption(optionAdi: string) {
  return normalizeOptionText(optionAdi).includes('kontrat sahibi')
}

export function isYetistiriciOption(optionAdi: string) {
  return normalizeOptionText(optionAdi).includes('yetiştirici')
}

export type KontratSahibiFieldKind = 'cinsiyet' | 'dogumTarihi' | 'adSoyad'

export function resolveKontratSahibiFieldKind(
  question: SurveyFillSoruView,
): KontratSahibiFieldKind | null {
  const normalized = normalizeSurveyQuestionText(question.soruMetni)
  if (!normalized.includes('kontrat sahibi')) return null

  if (normalized.includes('cinsiyet')) return 'cinsiyet'
  if (normalized.includes('doğum') || normalized.includes('dogum')) return 'dogumTarihi'
  if (
    normalized.includes('ad-soyad') ||
    normalized.includes('ad soyad') ||
    normalized.includes('adsoyad') ||
    (normalized.includes('ad') && normalized.includes('soyad'))
  ) {
    return 'adSoyad'
  }

  return null
}

export function findUretimiYapanQuestion(questions: SurveyFillSoruView[]) {
  return questions.find(isUretimiYapanQuestion) ?? null
}

export function findKontratSahibiOptionId(question: SurveyFillSoruView): number | null {
  const option = (question.altSecenekler ?? []).find((item) => isKontratSahibiOption(item.adi))
  return option?.id ?? null
}

export function isKontratSahibiSelected(
  questions: SurveyFillSoruView[],
  answers: Record<string, string>,
): boolean {
  const parent = findUretimiYapanQuestion(questions)
  if (!parent) return false

  const kontratSahibiOptionId = findKontratSahibiOptionId(parent)
  if (kontratSahibiOptionId == null) return false

  const selected = (answers[getQuestionKey(parent)] ?? '').trim()
  return selected === String(kontratSahibiOptionId)
}

function findGenderOptionId(
  options: AltSecenekOptionDto[],
  cinsiyet: string | null,
): string | null {
  if (!cinsiyet?.trim()) return null
  const target = parseGenderFromText(cinsiyet)
  if (target === 'bilinmiyor') return null

  const match = options.find((option) => parseGenderFromText(option.adi) === target)
  return match ? String(match.id) : null
}

export interface KontratSahibiAutofillResult {
  answers: Record<string, string>
  lockedKeys: Record<string, boolean>
  targetKeys: string[]
}

/**
 * Kontrat sahibi seçildiğinde bağlı sorulara ekici bilgilerini yazar.
 * Doğum tarihi ve ad-soyad endpointten geliyorsa kilitlenir.
 * Cinsiyet doldurulur ama her zaman düzenlenebilir kalır.
 */
export function buildKontratSahibiAutofill(
  questions: SurveyFillSoruView[],
  ekici: EkiciDto | null,
): KontratSahibiAutofillResult {
  const answers: Record<string, string> = {}
  const lockedKeys: Record<string, boolean> = {}
  const targetKeys: string[] = []

  if (!ekici) {
    return { answers, lockedKeys, targetKeys }
  }

  for (const question of questions) {
    const kind = resolveKontratSahibiFieldKind(question)
    if (!kind) continue

    const key = getQuestionKey(question)
    targetKeys.push(key)

    if (kind === 'cinsiyet') {
      const optionId = findGenderOptionId(question.altSecenekler ?? [], ekici.cinsiyet)
      if (optionId) {
        answers[key] = optionId
      }
      continue
    }

    if (kind === 'dogumTarihi') {
      if (ekici.dogumTarihi) {
        answers[key] = ekici.dogumTarihi
        lockedKeys[key] = true
      }
      continue
    }

    const fullName = getEkiciFullName(ekici)
    if (fullName && fullName !== '—') {
      answers[key] = fullName
      lockedKeys[key] = true
    }
  }

  return { answers, lockedKeys, targetKeys }
}

export function collectKontratSahibiTargetKeys(questions: SurveyFillSoruView[]): string[] {
  return questions
    .filter((question) => resolveKontratSahibiFieldKind(question) != null)
    .map((question) => getQuestionKey(question))
}
