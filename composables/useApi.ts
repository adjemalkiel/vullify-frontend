import type { Envelope, PaginationMeta } from '~/types/api'

function baseURL(): string {
  const config = useRuntimeConfig()
  return config.public.apiBaseUrl as string
}

function apiFetch<T>(url: string, opts: Record<string, unknown> = {}): Promise<T> {
  const toast = useToast()
  const full = `${baseURL()}${url}`
  return $fetch<T>(full, {
    ...opts,
    onResponseError({ response }: { response: { _data?: { message?: string; error?: string }; status: number } }) {
      const msg = response._data?.message || response._data?.error || `Request failed (${response.status})`
      toast.add({ title: 'Error', description: msg, color: 'error', icon: 'i-lucide-alert-triangle' })
    },
  } as Record<string, unknown>)
}

export function useApi() {
  /**
   * GET — unwraps Envelope, returns { data, meta }
   */
  async function apiGet<T>(url: string, params?: Record<string, string | number | undefined>): Promise<{ data: T; meta?: PaginationMeta }> {
    const qs = params ? '?' + Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&')
      : ''

    const result = await apiFetch<Envelope<T>>(`${url}${qs}`)
    return {
      data: result.data,
      meta: result.meta,
    }
  }

  /**
   * GET raw — no envelope unwrapping (for SBOM etc.)
   */
  async function apiGetRaw<T>(url: string, params?: Record<string, string | number | undefined>): Promise<T> {
    const qs = params ? '?' + Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&')
      : ''
    return apiFetch<T>(`${url}${qs}`)
  }

  async function apiPost<T>(url: string, body?: Record<string, unknown>): Promise<T> {
    const result = await apiFetch<Envelope<T>>(url, { method: 'POST', body })
    return result.data
  }

  async function apiPut<T>(url: string, body?: Record<string, unknown>): Promise<T> {
    const result = await apiFetch<Envelope<T>>(url, { method: 'PUT', body })
    return result.data
  }

  async function apiPatch<T>(url: string, body?: Record<string, unknown>): Promise<T> {
    const result = await apiFetch<Envelope<T>>(url, { method: 'PATCH', body })
    return result.data
  }

  async function apiDelete(url: string): Promise<void> {
    await apiFetch(url, { method: 'DELETE' })
  }

  return { apiGet, apiGetRaw, apiPost, apiPut, apiPatch, apiDelete }
}
