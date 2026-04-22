const base = () => import.meta.env.VITE_API_URL ?? ''

/** @type {'bearer' | 'sanctum'} */
export const AUTH_MODE = import.meta.env.VITE_API_AUTH === 'sanctum' ? 'sanctum' : 'bearer'

const TOKEN_KEY = import.meta.env.VITE_AUTH_TOKEN_KEY || 'auth_token'

/** @type {() => void} */
let onUnauthorized = () => {}

/**
 * @param {() => void} fn
 */
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn
}

/**
 * @returns {string | null}
 */
export function getStoredToken() {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

/**
 * @param {string} token
 */
export function setStoredToken(token) {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken() {
  if (typeof localStorage === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
}

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base()}${p}`
}

/**
 * Читает XSRF-TOKEN cookie (Laravel / Sanctum).
 * @returns {string | null}
 */
export function readXsrfToken() {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(/(?:^|; )XSRF-TOKEN=([^;]+)/)
  if (!m) return null
  try {
    return decodeURIComponent(m[1])
  } catch {
    return m[1]
  }
}

/**
 * Sanctum SPA: получить CSRF-cookie с бэкенда перед stateful-запросом.
 * @returns {Promise<void>}
 */
export async function ensureSanctumCsrf() {
  if (typeof fetch === 'undefined' || AUTH_MODE !== 'sanctum') return
  const u = apiUrl('/sanctum/csrf-cookie')
  const res = await fetch(u, {
    method: 'GET',
    credentials: 'include',
  })
  if (!res.ok) {
    throw new Error('Не удалось получить CSRF cookie (sanctum)')
  }
}

export function isSanctumMode() {
  return AUTH_MODE === 'sanctum'
}

/**
 * @param {Record<string, string>} headers
 * @param {RequestInit} init
 * @param {{ isMutating: boolean, includeBearer: boolean, includeSanctum: boolean }} opts
 */
function applyAuthHeaders(headers, init, { isMutating, includeBearer, includeSanctum }) {
  if (includeSanctum) {
    init.credentials = 'include'
    if (isMutating) {
      const xsrf = readXsrfToken()
      if (xsrf) {
        headers['X-XSRF-TOKEN'] = xsrf
      }
    }
  }
  if (includeBearer) {
    const t = getStoredToken()
    if (t) {
      headers['Authorization'] = `Bearer ${t}`
    }
  }
}

/**
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
 * - `VITE_API_AUTH=bearer` — `Authorization: Bearer` из `localStorage` (ключ `VITE_AUTH_TOKEN_KEY`).
 * - `VITE_API_AUTH=sanctum` — `credentials: 'include'` + `X-XSRF-TOKEN` для мутирующих запросов; перед логином/регистрацией вызовите `ensureSanctumCsrf()`.
 *
 * @param {string} path
 * - `public: true` — публичный запрос: без Bearer; для Sanctum у мутирующих запросов остаются `credentials` + `X-XSRF-TOKEN` (логин/регистрация).
 * - `public: false` (по умолчанию) — «как аутентифицированный» клиент.
 *
 * @param {RequestInit & { unwrapData?: boolean, body?: object, public?: boolean, skipErrorHandler?: boolean }} [options]
 */
export async function fetchJson(path, options = {}) {
  const {
    unwrapData = true,
    body: rawBody,
    headers: extraHeaders,
    public: isPublic = false,
    skipErrorHandler = false,
    ...rest
  } = options

  const method = (rest.method || 'GET').toUpperCase()
  const isMutating = !['GET', 'HEAD', 'OPTIONS'].includes(method)

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

  const init = /** @type {RequestInit} */ ({ ...rest, method, headers, body })

  if (AUTH_MODE === 'bearer' && !isPublic) {
    applyAuthHeaders(headers, init, { isMutating, includeBearer: true, includeSanctum: false })
  } else if (AUTH_MODE === 'sanctum') {
    applyAuthHeaders(headers, init, { isMutating, includeBearer: false, includeSanctum: true })
  }

  const res = await fetch(apiUrl(path), init)

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

  if (res.status === 401 && !skipErrorHandler) {
    onUnauthorized()
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
