import type { AxiosError } from 'axios'
import type { ProblemDetails } from './types'

export interface AppError {
  status: number
  message: string
  fieldErrors?: Record<string, string[]>
  isNetworkError: boolean
}

export function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    'message' in error &&
    'isNetworkError' in error
  )
}

export function normalizeApiError(error: unknown): AppError {
  if (isAppError(error)) return error

  if (!isAxiosError(error)) {
    return {
      status: 0,
      message: error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu',
      isNetworkError: false,
    }
  }

  if (!error.response) {
    return {
      status: 0,
      message: 'API sunucusuna ulaşılamıyor. Backend çalışıyor mu kontrol edin.',
      isNetworkError: true,
    }
  }

  const { status, data } = error.response
  const fieldErrors = extractFieldErrors(data)
  const apiMessage = extractResponseMessage(data)

  return {
    status,
    message:
      apiMessage ??
      (!isGenericHttpMessage(error.message) ? error.message : undefined) ??
      getDefaultMessageForStatus(status),
    fieldErrors,
    isNetworkError: false,
  }
}

function extractFieldErrors(data: unknown): Record<string, string[]> | undefined {
  if (!data || typeof data !== 'object') return undefined
  const row = data as ProblemDetails & { Errors?: Record<string, string[]> }
  return row.errors ?? row.Errors
}

function extractResponseMessage(data: unknown): string | undefined {
  if (typeof data === 'string') {
    return toUserFacingMessage(data)
  }

  if (!data || typeof data !== 'object') return undefined

  const row = data as Record<string, unknown>
  const candidates = [
    row.detail,
    row.Detail,
    row.message,
    row.Message,
    row.error,
    row.Error,
    row.title,
    row.Title,
  ]

  for (const candidate of candidates) {
    if (typeof candidate === 'string') {
      const message = toUserFacingMessage(candidate)
      if (message) return message
    }
  }

  const fieldErrors = extractFieldErrors(data)
  if (fieldErrors) {
    for (const messages of Object.values(fieldErrors)) {
      const first = messages.find((item) => item.trim())
      if (first) {
        const message = toUserFacingMessage(first)
        if (message) return message
      }
    }
  }

  return undefined
}

/** Reject IIS/ASP.NET HTML dumps and other non-user-facing payloads. */
function toUserFacingMessage(raw: string): string | undefined {
  const trimmed = raw.trim()
  if (!trimmed) return undefined
  if (isNonUserFacingMessage(trimmed)) return undefined
  return trimmed
}

function isNonUserFacingMessage(message: string): boolean {
  const trimmed = message.trim()
  // IIS / reverse-proxy HTML error pages are long and not meant for end users.
  if (trimmed.length > 400) return true

  const lower = trimmed.toLowerCase()
  return (
    lower.startsWith('<!doctype') ||
    lower.startsWith('<html') ||
    /<\s*html\b/i.test(trimmed) ||
    /<\s*head\b/i.test(trimmed) ||
    /<\s*body\b/i.test(trimmed) ||
    /<\s*style\b/i.test(trimmed) ||
    /<\s*title\b/i.test(trimmed) ||
    lower.includes('iis ') ||
    lower.includes('detailed error') ||
    lower.includes('server error in ') ||
    /method not allowed/i.test(trimmed)
  )
}

function isGenericHttpMessage(message: string): boolean {
  const trimmed = message.trim()
  return (
    /^request failed with status code \d+$/i.test(trimmed) ||
    trimmed === 'Network Error' ||
    isNonUserFacingMessage(trimmed)
  )
}

function getDefaultMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'İstek geçersiz veya iş kurallarına uymuyor.'
    case 401:
      return 'Oturumunuz sona ermiş olabilir. Lütfen tekrar giriş yapın.'
    case 403:
      return 'Bu işlem için yetkiniz yok.'
    case 404:
      return 'İstenen kayıt bulunamadı.'
    case 405:
      return 'Bu işlem şu anda gerçekleştirilemiyor. Lütfen daha sonra tekrar deneyin.'
    case 409:
      return 'Bu işlem mevcut verilerle çakışıyor.'
    case 415:
      return 'Gönderilen içerik türü desteklenmiyor.'
    case 422:
      return 'Gönderilen veriler doğrulanamadı.'
    case 502:
    case 503:
      return 'Sunucuya şu an ulaşılamıyor. Lütfen daha sonra tekrar deneyin.'
    default:
      if (status >= 500) {
        return 'Sunucuda bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
      }
      return 'İstek başarısız oldu.'
  }
}

function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error
}

export function getErrorMessage(error: unknown): string {
  const normalized = isAppError(error) ? error : normalizeApiError(error)
  return normalized.message
}
