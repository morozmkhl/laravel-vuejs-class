import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { pinia } from './pinia'
import { setUnauthorizedHandler } from './api/client'
import { useAuthStore } from './stores/auth'
import './assets/main.css'

const app = createApp(App)

if (import.meta.env.DEV) {
  app.config.errorHandler = (err, instance, info) => {
    console.error('[vue]', err, info, instance)
  }
}

app.use(pinia)

setUnauthorizedHandler(() => {
  useAuthStore(pinia).clearSession()
})

app.use(router)

const auth = useAuthStore(pinia)

const INIT_SAFETY_MS = 15_000

void Promise.race([
  auth.initialize().catch((e) => {
    console.error('[app] init auth failed (mounting anyway)', e)
  }),
  new Promise((resolve) => {
    setTimeout(resolve, INIT_SAFETY_MS)
  }),
]).finally(() => {
  app.mount('#app')
})
