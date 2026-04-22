import { createPinia } from 'pinia'

/** Один инстанс на приложение: его же передают в `useStore(pinia)` вне `setup` (роутер, fetch 401). */
export const pinia = createPinia()
