import type { AxiosError } from 'axios'
import type { ProblemDetails } from './types'

export interface AppError {
  status: number
  message: string
  fieldErrors?: Record<string, string[]>
  isNetworkError: boolean
}

export function normalizeApiError(error: unknown): AppError {
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
  const problem = (data ?? {}) as ProblemDetails & { message?: string }
  const legacyMessage = typeof problem.message === 'string' ? problem.message : undefined

  return {
    status,
    message:
      problem.detail ?? problem.title ?? legacyMessage ?? error.message ?? 'İstek başarısız oldu',
    fieldErrors: problem.errors,
    isNetworkError: false,
  }
}

function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error
}

export function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as AppError).message)
  }
  return 'Bir hata oluştu'
}
