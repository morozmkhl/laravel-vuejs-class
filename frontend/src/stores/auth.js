import { defineStore } from 'pinia'
import { AUTH_MODE, clearStoredToken } from '../api/client'
import * as authApi from '../api/auth'

/**
 * @typedef {import('../api/auth').AuthUser} AuthUser
 */

export const useAuthStore = defineStore('auth', {
  state: () => ({
    /** @type {AuthUser | null} */
    user: null,
    /**
     * Инициализация сессии: попытка загрузить пользователя (cookie или токен).
     */
    ready: false,
  }),

  getters: {
    isAuthenticated: (s) => s.user != null,
  },

  actions: {
    setUser(/** @type {AuthUser | null} */ u) {
      this.user = u
    },

    /**
     * Вызвать при 401: сброс локального пользователя/токена.
     */
    clearSession() {
      this.user = null
      if (AUTH_MODE === 'bearer') {
        clearStoredToken()
      }
    },

    /**
     * Один раз при старте приложения. Не бросает наружу: UI не должен блокироваться при сети/500.
     */
    async initialize() {
      this.ready = false
      try {
        if (AUTH_MODE === 'bearer' && !authApi.hasStoredToken()) {
          this.user = null
          return
        }
        const u = await authApi.fetchCurrentUser()
        this.user = u
        if (!u && AUTH_MODE === 'bearer') {
          clearStoredToken()
        }
      } catch (e) {
        console.error('[auth] initialize failed', e)
        this.user = null
        if (AUTH_MODE === 'bearer') {
          clearStoredToken()
        }
      } finally {
        this.ready = true
      }
    },

    /**
     * @param {{ email: string, password: string, remember?: boolean }} payload
     */
    async login(payload) {
      const { user } = await authApi.loginRequest(payload)
      this.user = user
    },

    /**
     * @param {{ name: string, email: string, password: string, password_confirmation: string }} payload
     */
    async register(payload) {
      const { user } = await authApi.registerRequest(payload)
      this.user = user
    },

    async logout() {
      try {
        await authApi.logoutRequest()
      } catch {
        /* сеть/эндпоинт: всё равно чистим клиент */
      }
      this.clearSession()
    },
  },
})
