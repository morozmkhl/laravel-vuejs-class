const base = () => import.meta.env.VITE_API_URL ?? ''

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base()}${p}`
}

/**
 * Разбор ошибки Laravel / JSON API.
 * @param {unknown} json
 * @param {number} status
 */
function formatApiError(json, status) {
  if (json && typeof json === 'object') {
    if ('message' in json && json.message) {
      const msg = String(json.message)
      if ('errors' in json && json.errors && typeof json.errors === 'object') {
        const first = Object.values(json.errors).flat()[0]
        if (first) {
          return Array.isArray(first) ? first[0] : String(first)
        }
      }
      return msg
    }
  }
  if (typeof json === 'string' && json) {
    return json
  }
  return `HTTP ${status}`
}

/**
 * HTTP JSON API: заголовки Accept и при необходимости Content-Type: application/json,
 * тело — объект сериализуется в JSON.
 *
 * Успешные ответы с телом `{ "data": ... }` по умолчанию возвращают только внутреннее значение `data`.
 *
 * @param {string} path
 * @param {RequestInit & { unwrapData?: boolean, body?: object }} [options]
 */
export async function fetchJson(path, options = {}) {
  const { unwrapData = true, body: rawBody, headers: extraHeaders, ...rest } = options

  /** @type {Record<string, string>} */
  const headers = {
    Accept: 'application/json',
    ...extraHeaders,
  }

  let body = rawBody
  if (rawBody != null && typeof rawBody === 'object' && !(rawBody instanceof FormData) && !(rawBody instanceof Blob)) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(rawBody)
  }

  const res = await fetch(apiUrl(path), {
    ...rest,
    headers,
    body,
  })

  const text = await res.text()
  /** @type {unknown} */
  let json = null
  if (text) {
    try {
      json = JSON.parse(text)
    } catch {
      json = { message: text }
    }
  }

  if (!res.ok) {
    throw new Error(formatApiError(json, res.status))
  }

  if (res.status === 204 || text === '') {
    return null
  }

  if (unwrapData && json && typeof json === 'object' && 'data' in json) {
    return json.data
  }

  return json
}
