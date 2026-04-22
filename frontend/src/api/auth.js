import {
  AUTH_MODE,
  clearStoredToken,
  ensureSanctumCsrf,
  fetchJson,
  getStoredToken,
  setStoredToken,
} from './client'

const prefix = () => (import.meta.env.VITE_AUTH_API_PREFIX ?? '/api').replace(/\/$/, '')

/**
 * @typedef {object} AuthUser
 * @property {number} id
 * @property {string} name
 * @property {string} email
 */

/**
 * @param {unknown} body
 * @returns {AuthUser | null}
 */
function pickUser(body) {
  if (!body || typeof body !== 'object') return null
  if ('user' in body && body.user && typeof body.user === 'object') {
    return /** @type {AuthUser} */ (body.user)
  }
  if (
    'email' in body &&
    typeof (/** @type {Record<string, unknown>} */ (body).email) === 'string' &&
    ('id' in body || 'name' in body)
  ) {
    return /** @type {AuthUser} */ (body)
  }
  if (
    'data' in body &&
    body.data &&
    typeof body.data === 'object' &&
    'id' in body.data
  ) {
    return /** @type {AuthUser} */ (body.data)
  }
  return null
}

/**
 * @param {unknown} body
 * @returns {string | null}
 */
function pickToken(body) {
  if (body && typeof body === 'object' && 'token' in body && body.token) {
    return String(body.token)
  }
  if (body && typeof body === 'object' && 'access_token' in body && body.access_token) {
    return String(body.access_token)
  }
  return null
}

/**
 * Текущий пользователь (сессия Sanctum или токен).
 * Таймаут по умолчанию, чтобы старт приложения не зависал при недоступном API.
 * @param {{ timeoutMs?: number }} [opts]
 * @returns {Promise<AuthUser | null>}
 */
export async function fetchCurrentUser(opts = {}) {
  const { timeoutMs = 12_000 } = opts
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null
  const t =
    controller &&
    setTimeout(() => {
      controller.abort()
    }, timeoutMs)
  try {
    const data = await fetchJson(`${prefix()}/user`, {
      method: 'GET',
      ...(controller ? { signal: controller.signal } : {}),
    })
    if (data && typeof data === 'object' && 'id' in data) {
      return /** @type {AuthUser} */ (data)
    }
    return null
  } catch {
    return null
  } finally {
    if (t) clearTimeout(t)
  }
}

/**
 * @param {{ email: string, password: string, remember?: boolean }} payload
 * @returns {Promise<{ user: AuthUser, token: string | null, raw: unknown }>}
 */
export async function loginRequest(payload) {
  if (AUTH_MODE === 'sanctum') {
    await ensureSanctumCsrf()
  }
  const path = `${prefix()}/login`
  const raw = await fetchJson(path, {
    method: 'POST',
    body: {
      email: payload.email,
      password: payload.password,
      remember: Boolean(payload.remember),
    },
    unwrapData: false,
    public: true,
  })
  const token = AUTH_MODE === 'bearer' ? pickToken(raw) : null
  if (token) {
    setStoredToken(token)
  }
  let user = pickUser(raw)
  if (!user) {
    user = await fetchCurrentUser()
  }
  if (!user) {
    throw new Error('Неверный ответ сервера: нет пользователя')
  }
  return { user, token, raw }
}

/**
 * @param {{ name: string, email: string, password: string, password_confirmation: string }} payload
 * @returns {Promise<{ user: AuthUser, token: string | null, raw: unknown }>}
 */
export async function registerRequest(payload) {
  if (AUTH_MODE === 'sanctum') {
    await ensureSanctumCsrf()
  }
  const path = `${prefix()}/register`
  const raw = await fetchJson(path, {
    method: 'POST',
    body: {
      name: payload.name,
      email: payload.email,
      password: payload.password,
      password_confirmation: payload.password_confirmation,
    },
    unwrapData: false,
    public: true,
  })
  const token = AUTH_MODE === 'bearer' ? pickToken(raw) : null
  if (token) {
    setStoredToken(token)
  }
  let user = pickUser(raw)
  if (!user) {
    user = await fetchCurrentUser()
  }
  if (!user) {
    throw new Error('Неверный ответ сервера: нет пользователя')
  }
  return { user, token, raw }
}

/**
 * @returns {Promise<void>}
 */
export async function logoutRequest() {
  if (AUTH_MODE === 'sanctum') {
    await ensureSanctumCsrf()
  }
  try {
    await fetchJson(`${prefix()}/logout`, { method: 'POST' })
  } finally {
    if (AUTH_MODE === 'bearer') {
      clearStoredToken()
    }
  }
}

/**
 * Сброс токена без запроса (если /logout на бэкенде ещё нет).
 */
export function clearAuthToken() {
  clearStoredToken()
}

/**
 * @returns {boolean}
 */
export function hasStoredToken() {
  return Boolean(getStoredToken())
}
