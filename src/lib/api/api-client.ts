import { api } from './axios-instance'
import type { ApiResponse } from './types'

/**
 * HTTP abstraction — features depend on this, not axios directly (DIP).
 * Unwraps .NET ApiResponse<T> when present; falls back to raw body.
 */
function unwrap<T>(data: ApiResponse<T> | T): T {
  if (typeof data === 'object' && data !== null && 'data' in data && 'success' in data) {
    const envelope = data as ApiResponse<T>
    if (!envelope.success) {
      throw envelope
    }
    return envelope.data
  }
  return data as T
}

export const apiClient = {
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    const { data } = await api.get<ApiResponse<T> | T>(url, { params })
    return unwrap(data)
  },

  async post<T>(url: string, body?: unknown): Promise<T> {
    const { data } = await api.post<ApiResponse<T> | T>(url, body)
    return unwrap(data)
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
