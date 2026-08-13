import type { AxiosRequestConfig } from 'axios'
import { api } from './axios-instance'
import type { ApiResponse } from './types'

export interface ApiSuccess<T> {
  data: T
  message?: string
}

function asRecord(data: unknown): Record<string, unknown> | null {
  if (typeof data !== 'object' || data === null) return null
  return data as Record<string, unknown>
}

function readEnvelopeFlag(row: Record<string, unknown>): boolean | undefined {
  if (typeof row.success === 'boolean') return row.success
  if (typeof row.Success === 'boolean') return row.Success
  return undefined
}

function readEnvelopeMessage(row: Record<string, unknown>): string | undefined {
  if (typeof row.message === 'string' && row.message.trim()) return row.message.trim()
  if (typeof row.Message === 'string' && row.Message.trim()) return row.Message.trim()
  return undefined
}

function throwFailedEnvelope(row: Record<string, unknown>): never {
  const message = readEnvelopeMessage(row) || 'İşlem başarısız oldu.'
  throw {
    status: 400,
    message,
    isNetworkError: false,
  }
}

/**
 * HTTP abstraction — features depend on this, not axios directly (DIP).
 * Unwraps .NET ApiResponse<T> when present; falls back to raw body.
 */
function unwrap<T>(data: ApiResponse<T> | T): T {
  return unwrapSuccess<T>(data).data
}

function unwrapSuccess<T>(data: ApiResponse<T> | T): ApiSuccess<T> {
  const row = asRecord(data)
  if (!row) return { data: data as T }

  const hasSuccessKey = 'success' in row || 'Success' in row
  const hasDataKey = 'data' in row || 'Data' in row
  if (!hasSuccessKey) {
    return { data: data as T, message: readEnvelopeMessage(row) }
  }

  if (readEnvelopeFlag(row) === false) throwFailedEnvelope(row)

  if (hasDataKey) {
    return {
      data: (row.data ?? row.Data) as T,
      message: readEnvelopeMessage(row),
    }
  }

  return { data: data as T, message: readEnvelopeMessage(row) }
}

export const apiClient = {
  async get<T>(url: string, params?: Record<string, unknown>, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await api.get<ApiResponse<T> | T>(url, { ...config, params })
    return unwrap(data)
  },

  async post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const { data } = await api.post<ApiResponse<T> | T>(url, body, config)
    return unwrap(data)
  },

  async postResult<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<ApiSuccess<T>> {
    const { data } = await api.post<ApiResponse<T> | T>(url, body, config)
    return unwrapSuccess(data)
  },

  async put<T>(url: string, body?: unknown): Promise<T> {
    const { data } = await api.put<ApiResponse<T> | T>(url, body)
    return unwrap(data)
  },

  async patch<T>(url: string, body?: unknown): Promise<T> {
    const { data } = await api.patch<ApiResponse<T> | T>(url, body)
    return unwrap(data)
  },

  async delete<T>(url: string): Promise<T> {
    const { data } = await api.delete<ApiResponse<T> | T>(url)
    return unwrap(data)
  },
}
