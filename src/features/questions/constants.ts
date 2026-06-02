import type { AnswerType } from './types/question.types'

export const ANSWER_TYPE_OPTIONS: { value: AnswerType; label: string }[] = [
  { value: 'long_text', label: 'Uzun Metin' },
  { value: 'short_text', label: 'Kısa Metin' },
  { value: 'single_choice', label: 'Tek Seçim' },
  { value: 'multiple_choice', label: 'Çoktan Seçmeli' },
  { value: 'number', label: 'Sayı' },
  { value: 'date', label: 'Tarih' },
]

export const CATEGORY_OPTIONS = [
  { value: 'Genel', label: 'Genel' },
  { value: 'Ürün', label: 'Ürün' },
  { value: 'Hizmet', label: 'Hizmet' },
  { value: 'Geri Bildirim', label: 'Geri Bildirim' },
]

export const CHOICE_ANSWER_TYPES: AnswerType[] = ['single_choice', 'multiple_choice']
