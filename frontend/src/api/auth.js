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
 * Ответы Laravel с `fetchJson(..., { unwrapData: false })` приходят как `{ data: ... }`.
 * Для логина/регистрации внутри лежит `{ user, token }`.
 * @param {unknown} body
 * @returns {Record<string, unknown> | null}
 */
function unwrapEnvelope(body) {
  if (!body || typeof body !== 'object') return null
  const o = /** @type {Record<string, unknown>} */ (body)
  if ('data' in o && o.data && typeof o.data === 'object' && !Array.isArray(o.data)) {
    return /** @type {Record<string, unknown>} */ (o.data)
  }
  return o
}

/**
 * @param {unknown} body
 * @returns {AuthUser | null}
 */
function pickUser(body) {
  const root = unwrapEnvelope(body)
  if (!root) return null
  if ('user' in root && root.user && typeof root.user === 'object') {
    return /** @type {AuthUser} */ (root.user)
  }
  if (
    'email' in root &&
    typeof root.email === 'string' &&
    ('id' in root || 'name' in root)
  ) {
    return /** @type {AuthUser} */ (root)
  }
  return null
}

/**
 * @param {unknown} body
 * @returns {string | null}
 */
function pickToken(body) {
  const root = unwrapEnvelope(body)
  if (!root) return null
  if ('token' in root && root.token) {
    return String(root.token)
  }
  if ('access_token' in root && root.access_token) {
    return String(root.access_token)
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
